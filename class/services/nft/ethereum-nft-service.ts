// Copyright (C) 2026 MalinWallet Infrastructure - All Rights Reserved
// @ts-ignore
import { NEXT_PUBLIC_ALCHEMY_API_KEY } from '@env';
import { NFT, NFTFetchOptions, NFTFetchResult, NFTStandard, NFTMetadata } from './types';

/**
 * Ethereum NFT Service using Alchemy API
 */
export class EthereumNFTService {
  private static ALCHEMY_BASE_URL = 'https://eth-mainnet.g.alchemy.com/nft/v3';

  /**
   * Fetch NFTs for an Ethereum address
   */
  static async fetchNFTs(options: NFTFetchOptions): Promise<NFTFetchResult> {
    const { owner, chain, pageKey, limit = 100 } = options;

    try {
      // Build Alchemy API URL
      const network = this.getAlchemyNetwork(chain);
      const url = `https://${network}.g.alchemy.com/nft/v3/${NEXT_PUBLIC_ALCHEMY_API_KEY}/getNFTsForOwner`;

      const params = new URLSearchParams({
        owner,
        pageSize: limit.toString(),
        withMetadata: 'true',
      });

      if (pageKey) {
        params.append('pageKey', pageKey);
      }

      const response = await fetch(`${url}?${params.toString()}`);

      if (!response.ok) {
        throw new Error(`Alchemy API error: ${response.statusText}`);
      }

      const data = await response.json();

      // Transform Alchemy response to our NFT format
      const nfts: NFT[] = (data.ownedNfts || []).map((alchemyNft: any) => 
        this.transformAlchemyNFT(alchemyNft, chain, owner)
      );

      return {
        nfts,
        pageKey: data.pageKey,
        totalCount: data.totalCount,
      };
    } catch (error) {
      console.error('Error fetching Ethereum NFTs:', error);
      throw error;
    }
  }

  /**
   * Fetch single NFT metadata
   */
  static async fetchNFTMetadata(
    contractAddress: string,
    tokenId: string,
    chain: string = 'ethereum',
  ): Promise<NFT | null> {
    try {
      const network = this.getAlchemyNetwork(chain);
      const url = `https://${network}.g.alchemy.com/nft/v3/${NEXT_PUBLIC_ALCHEMY_API_KEY}/getNFTMetadata`;

      const params = new URLSearchParams({
        contractAddress,
        tokenId,
        refreshCache: 'false',
      });

      const response = await fetch(`${url}?${params.toString()}`);

      if (!response.ok) {
        throw new Error(`Alchemy API error: ${response.statusText}`);
      }

      const data = await response.json();
      return this.transformAlchemyNFT(data, chain, '');
    } catch (error) {
      console.error('Error fetching NFT metadata:', error);
      return null;
    }
  }

  /**
   * Transform Alchemy NFT format to our format
   */
  private static transformAlchemyNFT(alchemyNft: any, chain: string, owner: string): NFT {
    const contract = alchemyNft.contract || {};
    const metadata = alchemyNft.metadata || {};
    const tokenId = alchemyNft.tokenId || alchemyNft.id?.tokenId || '0';

    // Determine NFT standard
    let standard = NFTStandard.UNKNOWN;
    if (contract.tokenType === 'ERC721') {
      standard = NFTStandard.ERC721;
    } else if (contract.tokenType === 'ERC1155') {
      standard = NFTStandard.ERC1155;
    }

    // Get image URL (prioritize from multiple sources)
    const image = 
      metadata.image || 
      alchemyNft.image?.cachedUrl ||
      alchemyNft.image?.originalUrl ||
      alchemyNft.media?.[0]?.gateway ||
      alchemyNft.media?.[0]?.raw ||
      '';

    // Parse metadata
    const nftMetadata: NFTMetadata = {
      name: metadata.name || alchemyNft.name,
      description: metadata.description || alchemyNft.description,
      image,
      external_url: metadata.external_url,
      attributes: metadata.attributes || [],
      animation_url: metadata.animation_url,
      background_color: metadata.background_color,
    };

    return {
      id: `${contract.address}-${tokenId}`,
      name: metadata.name || alchemyNft.name || `#${tokenId}`,
      description: metadata.description || alchemyNft.description,
      image: this.resolveIPFS(image),
      collection: contract.name ? {
        name: contract.name,
        image: contract.openSeaMetadata?.imageUrl,
        externalUrl: contract.openSeaMetadata?.externalUrl,
        floorPrice: contract.openSeaMetadata?.floorPrice,
      } : undefined,
      tokenId,
      contractAddress: contract.address,
      standard,
      chain,
      owner,
      balance: alchemyNft.balance || 1,
      metadata: nftMetadata,
      rawMetadata: alchemyNft,
      tokenUri: alchemyNft.tokenUri?.raw,
      cached: true,
      lastFetched: Date.now(),
    };
  }

  /**
   * Resolve IPFS URLs to HTTP gateways
   */
  private static resolveIPFS(url: string): string {
    if (!url) return '';
    
    if (url.startsWith('ipfs://')) {
      return url.replace('ipfs://', 'https://ipfs.io/ipfs/');
    }
    
    return url;
  }

  /**
   * Get Alchemy network identifier from chain name
   */
  private static getAlchemyNetwork(chain: string): string {
    const networkMap: Record<string, string> = {
      ethereum: 'eth-mainnet',
      polygon: 'polygon-mainnet',
      arbitrum: 'arb-mainnet',
      optimism: 'opt-mainnet',
      base: 'base-mainnet',
    };

    return networkMap[chain.toLowerCase()] || 'eth-mainnet';
  }
}
