// Copyright (C) 2026 MalinWallet Infrastructure - All Rights Reserved
import { PriceFetchOptions, PriceCache } from './types';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Price Service using CoinGecko API (free, no API key needed)
 */
export class PriceService {
  private static BASE_URL = 'https://api.coingecko.com/api/v3';
  private static CACHE_KEY = '@malinwallet:prices';
  private static CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  /**
   * Fetch token prices by CoinGecko IDs
   */
  static async fetchPrices(options: PriceFetchOptions): Promise<Record<string, any>> {
    const {
      coingeckoIds = [],
      vsCurrency = 'usd',
      includeMarketCap = true,
      include24hrChange = true,
    } = options;

    if (coingeckoIds.length === 0) {
      return {};
    }

    // Check cache first
    const cached = await this.getCachedPrices(coingeckoIds);
    if (Object.keys(cached).length === coingeckoIds.length) {
      return cached;
    }

    try {
      const ids = coingeckoIds.join(',');
      const params = new URLSearchParams({
        ids,
        vs_currencies: vsCurrency,
        include_market_cap: includeMarketCap.toString(),
        include_24hr_change: include24hrChange.toString(),
      });

      const response = await fetch(`${this.BASE_URL}/simple/price?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error(`CoinGecko API error: ${response.statusText}`);
      }

      const data = await response.json();
      
      // Transform to our format
      const prices: Record<string, any> = {};
      for (const [id, priceData] of Object.entries(data)) {
        prices[id] = {
          price: (priceData as any)[vsCurrency],
          change24h: (priceData as any)[`${vsCurrency}_24h_change`],
          marketCap: (priceData as any)[`${vsCurrency}_market_cap`],
        };
      }

      // Cache results
      await this.cachePrices(prices);

      return prices;
    } catch (error) {
      console.error('Error fetching prices:', error);
      return cached; // Return cached data on error
    }
  }

  /**
   * Fetch price for a single token
   */
  static async fetchPrice(coingeckoId: string, vsCurrency = 'usd'): Promise<number | null> {
    const prices = await this.fetchPrices({
      coingeckoIds: [coingeckoId],
      vsCurrency,
    });
    return prices[coingeckoId]?.price || null;
  }

  /**
   * Get cached prices
   */
  private static async getCachedPrices(coingeckoIds: string[]): Promise<Record<string, any>> {
    try {
      const cacheJson = await AsyncStorage.getItem(this.CACHE_KEY);
      if (!cacheJson) return {};

      const cache: PriceCache = JSON.parse(cacheJson);
      const now = Date.now();
      const result: Record<string, any> = {};

      for (const id of coingeckoIds) {
        const cached = cache[id];
        if (cached && now - cached.timestamp < this.CACHE_DURATION) {
          result[id] = {
            price: cached.price,
            change24h: cached.change24h,
          };
        }
      }

      return result;
    } catch (error) {
      console.error('Error reading price cache:', error);
      return {};
    }
  }

  /**
   * Cache prices
   */
  private static async cachePrices(prices: Record<string, any>): Promise<void> {
    try {
      const cacheJson = await AsyncStorage.getItem(this.CACHE_KEY);
      const cache: PriceCache = cacheJson ? JSON.parse(cacheJson) : {};
      const now = Date.now();

      for (const [id, priceData] of Object.entries(prices)) {
        cache[id] = {
          price: priceData.price,
          change24h: priceData.change24h || 0,
          timestamp: now,
        };
      }

      await AsyncStorage.setItem(this.CACHE_KEY, JSON.stringify(cache));
    } catch (error) {
      console.error('Error caching prices:', error);
    }
  }

  /**
   * Clear price cache
   */
  static async clearCache(): Promise<void> {
    await AsyncStorage.removeItem(this.CACHE_KEY);
  }

  /**
   * Search tokens by name/symbol
   */
  static async searchTokens(query: string): Promise<any[]> {
    try {
      const response = await fetch(`${this.BASE_URL}/search?query=${encodeURIComponent(query)}`);
      
      if (!response.ok) {
        throw new Error(`CoinGecko search error: ${response.statusText}`);
      }

      const data = await response.json();
      return data.coins || [];
    } catch (error) {
      console.error('Error searching tokens:', error);
      return [];
    }
  }

  /**
   * Get token info by CoinGecko ID
   */
  static async getTokenInfo(coingeckoId: string): Promise<any> {
    try {
      const response = await fetch(`${this.BASE_URL}/coins/${coingeckoId}`);
      
      if (!response.ok) {
        throw new Error(`CoinGecko token info error: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching token info:', error);
      return null;
    }
  }
}
