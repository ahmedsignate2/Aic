// Copyright (C) 2026 MalinWallet Infrastructure - All Rights Reserved
import AsyncStorage from '@react-native-async-storage/async-storage';
import { TokenService } from '../token/token-service';
import { PriceService } from '../token/price-service';

/**
 * Portfolio Analytics Service
 * Tracks portfolio value, P&L, and performance over time
 */

export interface PortfolioSnapshot {
  timestamp: number;
  totalValue: number;
  tokens: Array<{
    address: string;
    symbol: string;
    balance: number;
    price: number;
    value: number;
  }>;
}

export interface PortfolioPerformance {
  totalValue: number;
  totalChange24h: number;
  totalChangePercent24h: number;
  totalChange7d: number;
  totalChangePercent7d: number;
  totalChange30d: number;
  totalChangePercent30d: number;
  bestPerformer: {
    symbol: string;
    changePercent: number;
  };
  worstPerformer: {
    symbol: string;
    changePercent: number;
  };
}

export interface AssetAllocation {
  symbol: string;
  value: number;
  percentage: number;
  color: string;
}

export interface TransactionSummary {
  totalTransactions: number;
  totalSent: number;
  totalReceived: number;
  totalSwaps: number;
  avgGasFee: number;
}

export class PortfolioAnalyticsService {
  private static instance: PortfolioAnalyticsService;
  
  private readonly SNAPSHOT_KEY = '@malinwallet:portfolio_snapshots';
  private readonly SNAPSHOT_INTERVAL = 24 * 60 * 60 * 1000; // 24 hours

  private constructor() {}

  public static getInstance(): PortfolioAnalyticsService {
    if (!PortfolioAnalyticsService.instance) {
      PortfolioAnalyticsService.instance = new PortfolioAnalyticsService();
    }
    return PortfolioAnalyticsService.instance;
  }

  /**
   * Get current portfolio performance
   */
  public async getPortfolioPerformance(
    address: string,
    chainId: number
  ): Promise<PortfolioPerformance> {
    try {
      // Get current tokens
      const tokens = await TokenService.fetchTokens({ address, chainId });
      
      // Get prices with 24h change
      const tokenIds = tokens.map((t: any) => t.coingeckoId).filter(Boolean);
      const prices = await PriceService.fetchPrices({
        coingeckoIds: tokenIds as string[],
        vsCurrency: 'usd',
        include24hrChange: true,
      });

      let totalValue = 0;
      let totalChange24h = 0;
      let bestPerformer = { symbol: '', changePercent: -Infinity };
      let worstPerformer = { symbol: '', changePercent: Infinity };

      tokens.forEach((token: any) => {
        const balance = token.balance || 0;
        const price = token.price || 0;
        const value = balance * price;
        totalValue += value;

        const priceInfo = prices[token.coingeckoId || ''];
        if (priceInfo) {
          const change24h = value * (priceInfo.change24h / 100);
          totalChange24h += change24h;

          if (priceInfo.change24h > bestPerformer.changePercent) {
            bestPerformer = { symbol: token.symbol, changePercent: priceInfo.change24h };
          }
          if (priceInfo.change24h < worstPerformer.changePercent) {
            worstPerformer = { symbol: token.symbol, changePercent: priceInfo.change24h };
          }
        }
      });

      const totalChangePercent24h = totalValue > 0 ? (totalChange24h / totalValue) * 100 : 0;

      // Get 7d and 30d changes from snapshots
      const snapshots = await this.getSnapshots(address, chainId);
      const change7d = this.calculateChangeFromSnapshot(snapshots, 7);
      const change30d = this.calculateChangeFromSnapshot(snapshots, 30);

      return {
        totalValue,
        totalChange24h,
        totalChangePercent24h,
        totalChange7d: change7d.value,
        totalChangePercent7d: change7d.percent,
        totalChange30d: change30d.value,
        totalChangePercent30d: change30d.percent,
        bestPerformer,
        worstPerformer,
      };
    } catch (error) {
      console.error('Error getting portfolio performance:', error);
      throw error;
    }
  }

  /**
   * Get asset allocation
   */
  public async getAssetAllocation(
    address: string,
    chainId: number
  ): Promise<AssetAllocation[]> {
    try {
      const tokens = await TokenService.fetchTokens({ address, chainId });

      let totalValue = 0;
      const allocations: AssetAllocation[] = [];

      // Calculate total value
      tokens.forEach((token: any) => {
        totalValue += token.balance * (token.price || 0);
      });

      // Calculate percentages
      const colors = ['#FCD600', '#4ADE80', '#60A5FA', '#F472B6', '#A78BFA', '#FB923C'];
      
      tokens.forEach((token: any, index: number) => {
        const value = token.balance * (token.price || 0);
        if (value > 0) {
          allocations.push({
            symbol: token.symbol,
            value,
            percentage: (value / totalValue) * 100,
            color: colors[index % colors.length],
          });
        }
      });

      // Sort by value (highest first)
      allocations.sort((a, b) => b.value - a.value);

      return allocations;
    } catch (error) {
      console.error('Error getting asset allocation:', error);
      throw error;
    }
  }

  /**
   * Take portfolio snapshot
   */
  public async takeSnapshot(address: string, chainId: number): Promise<void> {
    try {
      const tokens = await TokenService.fetchTokens({ address, chainId });

      let totalValue = 0;
      const tokenData = tokens.map((token: any) => {
        const value = token.balance * (token.price || 0);
        totalValue += value;

        return {
          address: token.address,
          symbol: token.symbol,
          balance: token.balance,
          price: token.price || 0,
          value,
        };
      });

      const snapshot: PortfolioSnapshot = {
        timestamp: Date.now(),
        totalValue,
        tokens: tokenData,
      };

      // Get existing snapshots
      const snapshots = await this.getSnapshots(address, chainId);
      
      // Add new snapshot
      snapshots.push(snapshot);

      // Keep only last 90 days
      const cutoff = Date.now() - (90 * 24 * 60 * 60 * 1000);
      const filtered = snapshots.filter(s => s.timestamp > cutoff);

      // Save
      await this.saveSnapshots(address, chainId, filtered);
    } catch (error) {
      console.error('Error taking snapshot:', error);
    }
  }

  /**
   * Get historical portfolio value
   */
  public async getPortfolioHistory(
    address: string,
    chainId: number,
    days: number
  ): Promise<Array<{ timestamp: number; value: number }>> {
    try {
      const snapshots = await this.getSnapshots(address, chainId);
      const cutoff = Date.now() - (days * 24 * 60 * 60 * 1000);

      return snapshots
        .filter(s => s.timestamp > cutoff)
        .map(s => ({
          timestamp: s.timestamp,
          value: s.totalValue,
        }))
        .sort((a, b) => a.timestamp - b.timestamp);
    } catch (error) {
      console.error('Error getting portfolio history:', error);
      return [];
    }
  }

  /**
   * Calculate profit/loss
   */
  public calculateProfitLoss(
    snapshots: PortfolioSnapshot[]
  ): {
    totalProfit: number;
    totalLoss: number;
    netProfitLoss: number;
    profitableTokens: number;
    losingTokens: number;
  } {
    if (snapshots.length < 2) {
      return {
        totalProfit: 0,
        totalLoss: 0,
        netProfitLoss: 0,
        profitableTokens: 0,
        losingTokens: 0,
      };
    }

    const oldest = snapshots[0];
    const latest = snapshots[snapshots.length - 1];

    let totalProfit = 0;
    let totalLoss = 0;
    let profitableTokens = 0;
    let losingTokens = 0;

    latest.tokens.forEach(currentToken => {
      const oldToken = oldest.tokens.find(t => t.address === currentToken.address);
      if (oldToken) {
        const change = currentToken.value - oldToken.value;
        if (change > 0) {
          totalProfit += change;
          profitableTokens++;
        } else if (change < 0) {
          totalLoss += Math.abs(change);
          losingTokens++;
        }
      }
    });

    return {
      totalProfit,
      totalLoss,
      netProfitLoss: totalProfit - totalLoss,
      profitableTokens,
      losingTokens,
    };
  }

  /**
   * Calculate change from snapshot
   */
  private calculateChangeFromSnapshot(
    snapshots: PortfolioSnapshot[],
    days: number
  ): { value: number; percent: number } {
    if (snapshots.length < 2) {
      return { value: 0, percent: 0 };
    }

    const cutoff = Date.now() - (days * 24 * 60 * 60 * 1000);
    const oldSnapshot = snapshots.find(s => s.timestamp < cutoff);
    const latest = snapshots[snapshots.length - 1];

    if (!oldSnapshot) {
      return { value: 0, percent: 0 };
    }

    const change = latest.totalValue - oldSnapshot.totalValue;
    const percent = oldSnapshot.totalValue > 0 
      ? (change / oldSnapshot.totalValue) * 100 
      : 0;

    return { value: change, percent };
  }

  /**
   * Get snapshots from storage
   */
  private async getSnapshots(address: string, chainId: number): Promise<PortfolioSnapshot[]> {
    try {
      const key = `${this.SNAPSHOT_KEY}:${address}:${chainId}`;
      const data = await AsyncStorage.getItem(key);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error getting snapshots:', error);
      return [];
    }
  }

  /**
   * Save snapshots to storage
   */
  private async saveSnapshots(
    address: string,
    chainId: number,
    snapshots: PortfolioSnapshot[]
  ): Promise<void> {
    try {
      const key = `${this.SNAPSHOT_KEY}:${address}:${chainId}`;
      await AsyncStorage.setItem(key, JSON.stringify(snapshots));
    } catch (error) {
      console.error('Error saving snapshots:', error);
    }
  }

  /**
   * Auto-snapshot if needed
   */
  public async autoSnapshot(address: string, chainId: number): Promise<void> {
    try {
      const snapshots = await this.getSnapshots(address, chainId);
      const latestSnapshot = snapshots[snapshots.length - 1];

      // Take snapshot if none exists or last one is > 24h old
      if (!latestSnapshot || Date.now() - latestSnapshot.timestamp > this.SNAPSHOT_INTERVAL) {
        await this.takeSnapshot(address, chainId);
      }
    } catch (error) {
      console.error('Error in auto-snapshot:', error);
    }
  }
}
