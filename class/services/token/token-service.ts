// Copyright (C) 2026 MalinWallet Infrastructure - All Rights Reserved
import { Token, TokenBalance, TokenFetchOptions, TokenCache, ChainId, CustomToken, TokenStandard } from './types';
import { getChainConfig, getAlchemyNetwork, COMMON_TOKENS } from './chain-config';
import { PriceService } from './price-service';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ethers } from 'ethers';
// @ts-ignore
import { NEXT_PUBLIC_ALCHEMY_API_KEY } from '@env';

/**
 * Token Service for fetching and managing ERC-20/SPL tokens across multiple chains
 */
export class TokenService {
  private static CACHE_KEY_PREFIX = '@malinwallet:tokens';
  private static CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
  private static CUSTOM_TOKENS_KEY = '@malinwallet:custom_tokens';

  /**
   * Fetch all tokens for a wallet address on a specific chain
   */
  static async fetchTokens(options: TokenFetchOptions): Promise<Token[]> {
    const { address, chainId, includeNative = true, includeSpam = false } = options;

    // Check cache first
    const cached = await this.getCachedTokens(address, chainId);
    if (cached.length > 0) {
      return cached;
    }

    const chain = getChainConfig(chainId);
    let tokens: Token[] = [];

    if (chain.isEVM) {
      tokens = await this.fetchEVMTokens(address, chainId, includeSpam);
    } else if (chainId === ChainId.SOLANA) {
      tokens = await this.fetchSolanaTokens(address);
    }

    // Add native token if requested
    if (includeNative) {
      const nativeToken = await this.getNativeToken(address, chainId);
      if (nativeToken) {
        tokens = [nativeToken, ...tokens];
      }
    }

    // Add custom tokens
    const customTokens = await this.getCustomTokens(address, chainId);
    tokens = [...tokens, ...customTokens];

    // Fetch prices for all tokens
    await this.enrichWithPrices(tokens);

    // Cache results
    await this.cacheTokens(address, chainId, tokens);

    return tokens;
  }

  /**
   * Fetch EVM tokens using Alchemy API
   */
  private static async fetchEVMTokens(
    address: string,
    chainId: ChainId,
    includeSpam: boolean
  ): Promise<Token[]> {
    try {
      const network = getAlchemyNetwork(chainId);
      const url = `https://${network}.g.alchemy.com/v2/${NEXT_PUBLIC_ALCHEMY_API_KEY}`;

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'alchemy_getTokenBalances',
          params: [address, 'erc20'],
        }),
      });

      if (!response.ok) {
        throw new Error(`Alchemy API error: ${response.statusText}`);
      }

      const data = await response.json();
      const tokenBalances: TokenBalance[] = data.result?.tokenBalances || [];

      // Filter out zero balances and spam
      const filtered = tokenBalances.filter((tb) => {
        const balance = BigInt(tb.balance || '0');
        return balance > 0n;
      });

      // Fetch metadata for each token
      const tokens: Token[] = [];
      for (const tb of filtered) {
        const metadata = await this.fetchTokenMetadata(tb.contractAddress, chainId);
        if (!metadata) continue;

        // Skip spam tokens if not included
        if (!includeSpam && tb.possibleSpam) continue;

        const balance = BigInt(tb.balance);
        const decimals = metadata.decimals || 18;
        const balanceFormatted = ethers.formatUnits(balance, decimals);

        tokens.push({
          address: tb.contractAddress,
          symbol: metadata.symbol || 'UNKNOWN',
          name: metadata.name || 'Unknown Token',
          decimals,
          logo: metadata.logo,
          standard: TokenStandard.ERC20,
          chainId,
          balance: tb.balance,
          balanceFormatted,
          verified: !tb.possibleSpam,
          coingeckoId: metadata.coingeckoId,
        });
      }

      return tokens;
    } catch (error) {
      console.error('Error fetching EVM tokens:', error);
      return [];
    }
  }

  /**
   * Fetch Solana tokens (SPL tokens)
   */
  private static async fetchSolanaTokens(address: string): Promise<Token[]> {
    // TODO: Implement Solana SPL token fetching using Helius or Solana RPC
    // For now, return empty array
    return [];
  }

  /**
   * Fetch token metadata from Alchemy
   */
  private static async fetchTokenMetadata(
    contractAddress: string,
    chainId: ChainId
  ): Promise<any> {
    try {
      const network = getAlchemyNetwork(chainId);
      const url = `https://${network}.g.alchemy.com/v2/${NEXT_PUBLIC_ALCHEMY_API_KEY}`;

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'alchemy_getTokenMetadata',
          params: [contractAddress],
        }),
      });

      if (!response.ok) return null;

      const data = await response.json();
      const metadata = data.result;

      // Try to match with common tokens to get CoinGecko ID
      const commonTokens = COMMON_TOKENS[chainId] || [];
      const commonToken = commonTokens.find(
        (t) => t.address.toLowerCase() === contractAddress.toLowerCase()
      );

      return {
        symbol: metadata.symbol,
        name: metadata.name,
        decimals: metadata.decimals,
        logo: metadata.logo || commonToken?.logo,
        coingeckoId: commonToken?.coingeckoId,
      };
    } catch (error) {
      console.error('Error fetching token metadata:', error);
      return null;
    }
  }

  /**
   * Get native token (ETH, BNB, MATIC, etc.) with balance
   */
  private static async getNativeToken(address: string, chainId: ChainId): Promise<Token | null> {
    try {
      const chain = getChainConfig(chainId);
      if (!chain.isEVM) return null;

      const provider = new ethers.JsonRpcProvider(
        `${chain.rpcUrl}${NEXT_PUBLIC_ALCHEMY_API_KEY || ''}`
      );

      const balance = await provider.getBalance(address);
      const balanceFormatted = ethers.formatEther(balance);

      return {
        address: 'native',
        symbol: chain.symbol,
        name: chain.name,
        decimals: 18,
        logo: chain.logo,
        standard: TokenStandard.NATIVE,
        chainId,
        balance: balance.toString(),
        balanceFormatted,
        isNative: true,
        verified: true,
        coingeckoId: chain.coingeckoId,
      };
    } catch (error) {
      console.error('Error fetching native token:', error);
      return null;
    }
  }

  /**
   * Enrich tokens with price data
   */
  private static async enrichWithPrices(tokens: Token[]): Promise<void> {
    const coingeckoIds = tokens
      .filter((t) => t.coingeckoId)
      .map((t) => t.coingeckoId!);

    if (coingeckoIds.length === 0) return;

    const prices = await PriceService.fetchPrices({
      coingeckoIds,
      includeMarketCap: true,
      include24hrChange: true,
    });

    for (const token of tokens) {
      if (!token.coingeckoId) continue;

      const priceData = prices[token.coingeckoId];
      if (priceData) {
        token.price = priceData.price;
        token.priceChange24h = priceData.change24h;
        token.marketCap = priceData.marketCap;

        // Calculate balance in USD
        if (token.balanceFormatted && token.price) {
          token.balanceUSD = parseFloat(token.balanceFormatted) * token.price;
        }
      }
    }
  }

  /**
   * Add a custom token
   */
  static async addCustomToken(customToken: CustomToken): Promise<Token | null> {
    try {
      const { address, chainId, symbol, name, decimals, logo } = customToken;

      // Fetch metadata if not provided
      let tokenData = { symbol, name, decimals, logo };
      if (!symbol || !decimals) {
        const metadata = await this.fetchTokenMetadata(address, chainId);
        if (!metadata) {
          throw new Error('Failed to fetch token metadata');
        }
        tokenData = {
          symbol: symbol || metadata.symbol,
          name: name || metadata.name,
          decimals: decimals || metadata.decimals,
          logo: logo || metadata.logo,
        };
      }

      const token: Token = {
        address,
        symbol: tokenData.symbol || 'UNKNOWN',
        name: tokenData.name || 'Unknown Token',
        decimals: tokenData.decimals || 18,
        logo: tokenData.logo,
        standard: TokenStandard.ERC20,
        chainId,
        verified: false,
      };

      // Save to custom tokens
      await this.saveCustomToken(token);

      return token;
    } catch (error) {
      console.error('Error adding custom token:', error);
      return null;
    }
  }

  /**
   * Save custom token to storage
   */
  private static async saveCustomToken(token: Token): Promise<void> {
    try {
      const customTokensJson = await AsyncStorage.getItem(this.CUSTOM_TOKENS_KEY);
      const customTokens: Token[] = customTokensJson ? JSON.parse(customTokensJson) : [];

      // Check if already exists
      const exists = customTokens.find(
        (t) =>
          t.address.toLowerCase() === token.address.toLowerCase() &&
          t.chainId === token.chainId
      );

      if (!exists) {
        customTokens.push(token);
        await AsyncStorage.setItem(this.CUSTOM_TOKENS_KEY, JSON.stringify(customTokens));
      }
    } catch (error) {
      console.error('Error saving custom token:', error);
    }
  }

  /**
   * Get custom tokens for address and chain
   */
  private static async getCustomTokens(address: string, chainId: ChainId): Promise<Token[]> {
    try {
      const customTokensJson = await AsyncStorage.getItem(this.CUSTOM_TOKENS_KEY);
      if (!customTokensJson) return [];

      const allCustomTokens: Token[] = JSON.parse(customTokensJson);
      return allCustomTokens.filter((t) => t.chainId === chainId);
    } catch (error) {
      console.error('Error getting custom tokens:', error);
      return [];
    }
  }

  /**
   * Remove custom token
   */
  static async removeCustomToken(address: string, chainId: ChainId): Promise<void> {
    try {
      const customTokensJson = await AsyncStorage.getItem(this.CUSTOM_TOKENS_KEY);
      if (!customTokensJson) return;

      const customTokens: Token[] = JSON.parse(customTokensJson);
      const filtered = customTokens.filter(
        (t) =>
          !(
            t.address.toLowerCase() === address.toLowerCase() &&
            t.chainId === chainId
          )
      );

      await AsyncStorage.setItem(this.CUSTOM_TOKENS_KEY, JSON.stringify(filtered));
    } catch (error) {
      console.error('Error removing custom token:', error);
    }
  }

  /**
   * Get cached tokens
   */
  private static async getCachedTokens(address: string, chainId: ChainId): Promise<Token[]> {
    try {
      const cacheKey = `${this.CACHE_KEY_PREFIX}:${address}:${chainId}`;
      const cacheJson = await AsyncStorage.getItem(cacheKey);
      if (!cacheJson) return [];

      const cache: TokenCache = JSON.parse(cacheJson);
      const now = Date.now();

      if (now - cache.timestamp < this.CACHE_DURATION) {
        return cache.tokens;
      }

      return [];
    } catch (error) {
      console.error('Error reading token cache:', error);
      return [];
    }
  }

  /**
   * Cache tokens
   */
  private static async cacheTokens(
    address: string,
    chainId: ChainId,
    tokens: Token[]
  ): Promise<void> {
    try {
      const cacheKey = `${this.CACHE_KEY_PREFIX}:${address}:${chainId}`;
      const cache: TokenCache = {
        tokens,
        timestamp: Date.now(),
        address,
        chainId,
      };
      await AsyncStorage.setItem(cacheKey, JSON.stringify(cache));
    } catch (error) {
      console.error('Error caching tokens:', error);
    }
  }

  /**
   * Clear token cache
   */
  static async clearCache(address?: string, chainId?: ChainId): Promise<void> {
    try {
      if (address && chainId) {
        const cacheKey = `${this.CACHE_KEY_PREFIX}:${address}:${chainId}`;
        await AsyncStorage.removeItem(cacheKey);
      } else {
        // Clear all token caches
        const keys = await AsyncStorage.getAllKeys();
        const tokenKeys = keys.filter((key) => key.startsWith(this.CACHE_KEY_PREFIX));
        await AsyncStorage.multiRemove(tokenKeys);
      }
    } catch (error) {
      console.error('Error clearing token cache:', error);
    }
  }

  /**
   * Validate ERC-20 token address
   */
  static async validateTokenAddress(address: string, chainId: ChainId): Promise<boolean> {
    try {
      if (!ethers.isAddress(address)) {
        return false;
      }

      const metadata = await this.fetchTokenMetadata(address, chainId);
      return metadata !== null;
    } catch (error) {
      return false;
    }
  }
}
