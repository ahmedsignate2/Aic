// Copyright (C) 2026 MalinWallet Infrastructure - All Rights Reserved
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Chart Service
 * Fetches historical price data from CoinGecko
 */

export interface PricePoint {
  timestamp: number;
  price: number;
  volume?: number;
}

export interface PriceHistory {
  tokenId: string;
  prices: PricePoint[];
  timeframe: Timeframe;
  fetchedAt: number;
}

export type Timeframe = '1D' | '7D' | '30D' | '90D' | '1Y' | 'ALL';

export class ChartService {
  private static instance: ChartService;
  
  private readonly COINGECKO_API = 'https://api.coingecko.com/api/v3';
  private readonly CACHE_KEY = '@malinwallet:price_history';
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  private constructor() {}

  public static getInstance(): ChartService {
    if (!ChartService.instance) {
      ChartService.instance = new ChartService();
    }
    return ChartService.instance;
  }

  /**
   * Get historical price data
   */
  public async getPriceHistory(
    tokenId: string,
    timeframe: Timeframe
  ): Promise<PriceHistory> {
    try {
      // Check cache first
      const cached = await this.getCachedHistory(tokenId, timeframe);
      if (cached) {
        return cached;
      }

      // Fetch from CoinGecko
      const days = this.timeframeToDays(timeframe);
      const url = `${this.COINGECKO_API}/coins/${tokenId}/market_chart`;
      const params = new URLSearchParams({
        vs_currency: 'usd',
        days: days.toString(),
        interval: days <= 1 ? 'hourly' : 'daily',
      });

      const response = await fetch(`${url}?${params}`);
      
      if (!response.ok) {
        throw new Error(`CoinGecko API error: ${response.statusText}`);
      }

      const data = await response.json();

      // Transform data
      const prices: PricePoint[] = data.prices.map((point: [number, number]) => ({
        timestamp: point[0],
        price: point[1],
      }));

      // Add volume if available
      if (data.total_volumes && data.total_volumes.length === prices.length) {
        prices.forEach((point, index) => {
          point.volume = data.total_volumes[index][1];
        });
      }

      const history: PriceHistory = {
        tokenId,
        prices,
        timeframe,
        fetchedAt: Date.now(),
      };

      // Cache result
      await this.cacheHistory(history);

      return history;
    } catch (error) {
      console.error('Error fetching price history:', error);
      throw error;
    }
  }

  /**
   * Get current price with 24h change
   */
  public async getCurrentPrice(tokenId: string): Promise<{
    price: number;
    change24h: number;
    high24h: number;
    low24h: number;
    marketCap: number;
    volume24h: number;
  }> {
    try {
      const url = `${this.COINGECKO_API}/coins/${tokenId}`;
      const params = new URLSearchParams({
        localization: 'false',
        tickers: 'false',
        market_data: 'true',
        community_data: 'false',
        developer_data: 'false',
      });

      const response = await fetch(`${url}?${params}`);
      
      if (!response.ok) {
        throw new Error(`CoinGecko API error: ${response.statusText}`);
      }

      const data = await response.json();
      const marketData = data.market_data;

      return {
        price: marketData.current_price.usd,
        change24h: marketData.price_change_percentage_24h,
        high24h: marketData.high_24h.usd,
        low24h: marketData.low_24h.usd,
        marketCap: marketData.market_cap.usd,
        volume24h: marketData.total_volume.usd,
      };
    } catch (error) {
      console.error('Error fetching current price:', error);
      throw error;
    }
  }

  /**
   * Get multiple token prices (batch)
   */
  public async getBatchPrices(tokenIds: string[]): Promise<Record<string, number>> {
    try {
      const url = `${this.COINGECKO_API}/simple/price`;
      const params = new URLSearchParams({
        ids: tokenIds.join(','),
        vs_currencies: 'usd',
        include_24hr_change: 'true',
      });

      const response = await fetch(`${url}?${params}`);
      
      if (!response.ok) {
        throw new Error(`CoinGecko API error: ${response.statusText}`);
      }

      const data = await response.json();

      const prices: Record<string, number> = {};
      for (const [tokenId, priceData] of Object.entries(data)) {
        prices[tokenId] = (priceData as any).usd;
      }

      return prices;
    } catch (error) {
      console.error('Error fetching batch prices:', error);
      throw error;
    }
  }

  /**
   * Search token by contract address
   */
  public async searchTokenByAddress(
    address: string,
    chainId: number
  ): Promise<string | null> {
    try {
      // Map chain ID to CoinGecko platform ID
      const platformMap: Record<number, string> = {
        1: 'ethereum',
        137: 'polygon-pos',
        56: 'binance-smart-chain',
        42161: 'arbitrum-one',
        10: 'optimistic-ethereum',
        43114: 'avalanche',
      };

      const platform = platformMap[chainId];
      if (!platform) {
        return null;
      }

      const url = `${this.COINGECKO_API}/coins/${platform}/contract/${address}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      return data.id; // CoinGecko token ID
    } catch (error) {
      console.error('Error searching token:', error);
      return null;
    }
  }

  /**
   * Calculate price statistics
   */
  public calculateStats(prices: PricePoint[]): {
    min: number;
    max: number;
    average: number;
    change: number;
    changePercent: number;
  } {
    if (prices.length === 0) {
      return { min: 0, max: 0, average: 0, change: 0, changePercent: 0 };
    }

    const priceValues = prices.map(p => p.price);
    const min = Math.min(...priceValues);
    const max = Math.max(...priceValues);
    const average = priceValues.reduce((sum, p) => sum + p, 0) / priceValues.length;
    
    const firstPrice = prices[0].price;
    const lastPrice = prices[prices.length - 1].price;
    const change = lastPrice - firstPrice;
    const changePercent = (change / firstPrice) * 100;

    return { min, max, average, change, changePercent };
  }

  /**
   * Convert timeframe to days
   */
  private timeframeToDays(timeframe: Timeframe): number {
    switch (timeframe) {
      case '1D': return 1;
      case '7D': return 7;
      case '30D': return 30;
      case '90D': return 90;
      case '1Y': return 365;
      case 'ALL': return 'max' as any;
      default: return 7;
    }
  }

  /**
   * Cache price history
   */
  private async cacheHistory(history: PriceHistory): Promise<void> {
    try {
      const key = `${this.CACHE_KEY}:${history.tokenId}:${history.timeframe}`;
      await AsyncStorage.setItem(key, JSON.stringify(history));
    } catch (error) {
      console.error('Error caching history:', error);
    }
  }

  /**
   * Get cached price history
   */
  private async getCachedHistory(
    tokenId: string,
    timeframe: Timeframe
  ): Promise<PriceHistory | null> {
    try {
      const key = `${this.CACHE_KEY}:${tokenId}:${timeframe}`;
      const cached = await AsyncStorage.getItem(key);
      
      if (!cached) return null;

      const history: PriceHistory = JSON.parse(cached);
      const age = Date.now() - history.fetchedAt;

      if (age > this.CACHE_DURATION) {
        return null;
      }

      return history;
    } catch (error) {
      return null;
    }
  }
}
