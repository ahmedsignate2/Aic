// Copyright (C) 2026 MalinWallet Infrastructure - All Rights Reserved
import { EthereumNFTService } from './ethereum-nft-service';
import { SolanaNFTService } from './solana-nft-service';
import { NFT, NFTFetchOptions, NFTFetchResult, NFTChain } from './types';
import AsyncStorage from '@react-native-async-storage/async-storage';

const NFT_CACHE_KEY = '@malinwallet:nfts';
const CACHE_EXPIRY = 5 * 60 * 1000; // 5 minutes

/**
 * Unified NFT Service (Ethereum + Solana)
 */
export class NFTService {
  /**
   * Fetch NFTs for any chain
   */
  static async fetchNFTs(options: NFTFetchOptions): Promise<NFTFetchResult> {
    const { chain } = options;

    // Check cache first
    const cached = await this.getCachedNFTs(options.owner, chain);
    if (cached && Date.now() - cached.timestamp < CACHE_EXPIRY) {
      return { nfts: cached.nfts, totalCount: cached.nfts.length };
    }

    try {
      let result: NFTFetchResult;

      if (chain === 'solana') {
        result = await SolanaNFTService.fetchNFTs(options);
      } else {
        // Ethereum and all EVM chains
        result = await EthereumNFTService.fetchNFTs(options);
      }

      // Cache the result
      await this.cacheNFTs(options.owner, chain, result.nfts);

      return result;
    } catch (error) {
      console.error(`Error fetching NFTs for ${chain}:`, error);
      
      // Return cached data as fallback
      if (cached) {
        return { nfts: cached.nfts, totalCount: cached.nfts.length };
      }

      throw error;
    }
  }

  /**
   * Fetch single NFT metadata
   */
  static async fetchNFTMetadata(
    identifier: string, // contractAddress-tokenId for ETH, mint for SOL
    chain: NFTChain,
  ): Promise<NFT | null> {
    try {
      if (chain === 'solana') {
        return await SolanaNFTService.fetchNFTMetadata(identifier);
      } else {
        const [contractAddress, tokenId] = identifier.split('-');
        return await EthereumNFTService.fetchNFTMetadata(contractAddress, tokenId, chain);
      }
    } catch (error) {
      console.error('Error fetching NFT metadata:', error);
      return null;
    }
  }

  /**
   * Get cached NFTs
   */
  private static async getCachedNFTs(owner: string, chain: NFTChain): Promise<{ nfts: NFT[]; timestamp: number } | null> {
    try {
      const key = `${NFT_CACHE_KEY}:${owner}:${chain}`;
      const cached = await AsyncStorage.getItem(key);
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      console.error('Error reading NFT cache:', error);
      return null;
    }
  }

  /**
   * Cache NFTs
   */
  private static async cacheNFTs(owner: string, chain: NFTChain, nfts: NFT[]): Promise<void> {
    try {
      const key = `${NFT_CACHE_KEY}:${owner}:${chain}`;
      await AsyncStorage.setItem(key, JSON.stringify({
        nfts,
        timestamp: Date.now(),
      }));
    } catch (error) {
      console.error('Error caching NFTs:', error);
    }
  }

  /**
   * Clear cache for an address
   */
  static async clearCache(owner: string, chain?: NFTChain): Promise<void> {
    try {
      if (chain) {
        const key = `${NFT_CACHE_KEY}:${owner}:${chain}`;
        await AsyncStorage.removeItem(key);
      } else {
        // Clear all chains for this owner
        const keys = await AsyncStorage.getAllKeys();
        const ownerKeys = keys.filter(k => k.startsWith(`${NFT_CACHE_KEY}:${owner}:`));
        await AsyncStorage.multiRemove(ownerKeys);
      }
    } catch (error) {
      console.error('Error clearing NFT cache:', error);
    }
  }

  /**
   * Get all NFTs for a wallet (all chains)
   */
  static async fetchAllNFTs(address: string, chains: NFTChain[]): Promise<NFT[]> {
    const results = await Promise.allSettled(
      chains.map(chain => this.fetchNFTs({ owner: address, chain }))
    );

    const allNFTs: NFT[] = [];
    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        allNFTs.push(...result.value.nfts);
      } else {
        console.error(`Failed to fetch NFTs for ${chains[index]}:`, result.reason);
      }
    });

    return allNFTs;
  }
}

export * from './types';
export { EthereumNFTService, SolanaNFTService };
