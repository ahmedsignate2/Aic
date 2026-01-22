// Copyright (C) 2026 MalinWallet Infrastructure - All Rights Reserved
// @ts-ignore
import { NEXT_PUBLIC_HELIUS_API_KEY, SOLANA_RPC_URL } from '@env';
import { NFT, NFTFetchOptions, NFTFetchResult, NFTStandard } from './types';
import { Connection, PublicKey } from '@solana/web3.js';

/**
 * Solana NFT Service using Helius DAS API
 */
export class SolanaNFTService {
  /**
   * Fetch NFTs for a Solana address using Helius DAS API
   */
  static async fetchNFTs(options: NFTFetchOptions): Promise<NFTFetchResult> {
    const { owner, limit = 100, pageKey } = options;

    try {
      const url = `https://mainnet.helius-rpc.com/?api-key=${NEXT_PUBLIC_HELIUS_API_KEY}`;

      const payload = {
        jsonrpc: '2.0',
        id: 'malin-nft-fetch',
        method: 'getAssetsByOwner',
        params: {
          ownerAddress: owner,
          page: pageKey ? parseInt(pageKey) : 1,
          limit,
          displayOptions: {
            showFungible: false,
            showNativeBalance: false,
          },
        },
      };

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Helius API error: ${response.statusText}`);
      }

      const data = await response.json();
      const assets = data.result?.items || [];

      // Transform to our NFT format
      const nfts: NFT[] = assets
        .filter((asset: any) => asset.interface === 'V1_NFT' || asset.interface === 'Custom')
        .map((asset: any) => this.transformHeliusNFT(asset, owner));

      return {
        nfts,
        pageKey: data.result?.page < data.result?.total ? (data.result.page + 1).toString() : undefined,
        totalCount: data.result?.total || nfts.length,
      };
    } catch (error) {
      console.error('Error fetching Solana NFTs:', error);
      throw error;
    }
  }

  /**
   * Fetch single NFT metadata
   */
  static async fetchNFTMetadata(mint: string): Promise<NFT | null> {
    try {
      const url = `https://mainnet.helius-rpc.com/?api-key=${NEXT_PUBLIC_HELIUS_API_KEY}`;

      const payload = {
        jsonrpc: '2.0',
        id: 'malin-nft-metadata',
        method: 'getAsset',
        params: {
          id: mint,
          displayOptions: {
            showFungible: false,
          },
        },
      };

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Helius API error: ${response.statusText}`);
      }

      const data = await response.json();
      return this.transformHeliusNFT(data.result, '');
    } catch (error) {
      console.error('Error fetching Solana NFT metadata:', error);
      return null;
    }
  }

  /**
   * Transform Helius asset to our NFT format
   */
  private static transformHeliusNFT(asset: any, owner: string): NFT {
    const content = asset.content || {};
    const metadata = content.metadata || {};
    const links = content.links || {};

    // Get image URL
    const image = 
      links.image || 
      content.files?.[0]?.uri ||
      content.files?.[0]?.cdn_uri ||
      '';

    // Parse attributes
    const attributes = (metadata.attributes || []).map((attr: any) => ({
      trait_type: attr.trait_type,
      value: attr.value,
    }));

    // Collection info
    const grouping = asset.grouping?.find((g: any) => g.group_key === 'collection');
    const collection = grouping ? {
      name: grouping.group_value || metadata.symbol || 'Unknown',
      image: asset.content?.links?.image,
    } : undefined;

    return {
      id: asset.id,
      name: content.metadata?.name || `Solana NFT #${asset.id.substring(0, 8)}`,
      description: content.metadata?.description,
      image: this.resolveIPFS(image),
      collection,
      tokenId: asset.id,
      mint: asset.id,
      standard: NFTStandard.METAPLEX,
      chain: 'solana',
      owner: owner || asset.ownership?.owner || '',
      balance: 1,
      metadata: {
        name: content.metadata?.name,
        description: content.metadata?.description,
        image,
        external_url: links.external_url,
        attributes,
        animation_url: content.files?.find((f: any) => f.mime === 'video/mp4')?.uri,
      },
      rawMetadata: asset,
      tokenUri: content.json_uri,
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
}
