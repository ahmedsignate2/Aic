/**
 * Portfolio Homepage Service
 * Aggregate portfolio value across all wallets and chains
 */

import { ethers } from 'ethers';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PriceService } from '../token/price-service';
import { CHAIN_CONFIG } from '../token/chain-config';

const CACHE_KEY = '@malinwallet:portfolio:homepage';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export interface WalletBalance {
  walletId: string;
  walletType: string;
  name: string;
  address: string;
  chain: string;
  chainId: number;
  balance: string; // native token balance
  balanceUSD: number;
  symbol: string;
}

export interface PortfolioSummary {
  totalValueUSD: number;
  change24h: number; // percentage
  change24hUSD: number;
  wallets: WalletBalance[];
  assetBreakdown: AssetAllocation[];
  topAssets: AssetAllocation[];
  lastUpdated: number;
}

export interface AssetAllocation {
  name: string;
  symbol: string;
  valueUSD: number;
  percentage: number;
  chain: string;
  logo?: string;
}

export class PortfolioHomepageService {
  private static instance: PortfolioHomepageService;

  private constructor() {}

  static getInstance(): PortfolioHomepageService {
    if (!PortfolioHomepageService.instance) {
      PortfolioHomepageService.instance = new PortfolioHomepageService();
    }
    return PortfolioHomepageService.instance;
  }

  /**
   * Get complete portfolio summary
   */
  async getPortfolioSummary(wallets: any[]): Promise<PortfolioSummary> {
    // Check cache
    try {
      const cached = await AsyncStorage.getItem(CACHE_KEY);
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < CACHE_DURATION) {
          return data;
        }
      }
    } catch (error) {
      console.log('Cache read error:', error);
    }

    // Calculate fresh data
    const summary = await this.calculatePortfolio(wallets);

    // Cache
    try {
      await AsyncStorage.setItem(
        CACHE_KEY,
        JSON.stringify({ data: summary, timestamp: Date.now() }),
      );
    } catch (error) {
      console.log('Cache write error:', error);
    }

    return summary;
  }

  private async calculatePortfolio(wallets: any[]): Promise<PortfolioSummary> {
    const walletBalances: WalletBalance[] = [];
    let totalValueUSD = 0;

    // Process each wallet
    for (const wallet of wallets) {
      try {
        const balance = await this.getWalletBalance(wallet);
        if (balance) {
          walletBalances.push(balance);
          totalValueUSD += balance.balanceUSD;
        }
      } catch (error) {
        console.error(`Error processing wallet ${wallet.getLabel()}:`, error);
      }
    }

    // Calculate asset breakdown
    const assetBreakdown = this.calculateAssetBreakdown(walletBalances, totalValueUSD);

    // Get top 5 assets
    const topAssets = assetBreakdown
      .sort((a, b) => b.valueUSD - a.valueUSD)
      .slice(0, 5);

    // Calculate 24h change (simplified - would need historical data)
    const change24h = 0; // TODO: Implement with historical snapshots
    const change24hUSD = 0;

    return {
      totalValueUSD,
      change24h,
      change24hUSD,
      wallets: walletBalances,
      assetBreakdown,
      topAssets,
      lastUpdated: Date.now(),
    };
  }

  private async getWalletBalance(wallet: any): Promise<WalletBalance | null> {
    const type = wallet.type;
    const address = wallet.getAddress ? wallet.getAddress() : null;
    
    if (!address) return null;

    // Bitcoin wallets
    if (type.includes('Bitcoin') || type.includes('BTC')) {
      const balance = wallet.getBalance();
      const priceData = await PriceService.fetchPrices({ 
        coingeckoIds: ['bitcoin'],
        vsCurrency: 'usd'
      });
      const btcPrice = priceData['bitcoin']?.price || 0;
      const btcAmount = balance / 100000000; // satoshi to BTC
      
      return {
        walletId: wallet.getID(),
        walletType: type,
        name: wallet.getLabel(),
        address,
        chain: 'Bitcoin',
        chainId: 0,
        balance: btcAmount.toString(),
        balanceUSD: btcAmount * btcPrice,
        symbol: 'BTC',
      };
    }

    // Ethereum wallets
    if (type === 'EthereumWallet' || type.includes('Ethereum')) {
      try {
        const chainArray = Object.values(CHAIN_CONFIG);
        const chain = chainArray.find((c: any) => c.chainId === 1);
        if (!chain) return null;

        const provider = new ethers.JsonRpcProvider(chain.rpcUrl);
        const balance = await provider.getBalance(address);
        const ethAmount = parseFloat(ethers.formatEther(balance));
        
        // Fetch ETH price
        const priceData = await PriceService.fetchPrices({
          coingeckoIds: ['ethereum'],
          vsCurrency: 'usd',
        });
        const ethPrice = priceData['ethereum']?.usd || 0;

        return {
          walletId: wallet.getID(),
          walletType: type,
          name: wallet.getLabel(),
          address,
          chain: 'Ethereum',
          chainId: 1,
          balance: ethAmount.toString(),
          balanceUSD: ethAmount * ethPrice,
          symbol: 'ETH',
        };
      } catch (error) {
        console.error('Error fetching ETH balance:', error);
        return null;
      }
    }

    // Solana wallets
    if (type === 'SolanaWallet' || type.includes('Solana')) {
      try {
        const { Connection, PublicKey, LAMPORTS_PER_SOL } = require('@solana/web3.js');
        const connection = new Connection('https://api.mainnet-beta.solana.com');
        const pubkey = new PublicKey(address);
        const balance = await connection.getBalance(pubkey);
        const solAmount = balance / LAMPORTS_PER_SOL;
        const solPrice = await PriceService.fetchPrices({
          coingeckoIds: ['solana'],
          vsCurrency: 'usd'
        });
        const priceUsd = solPrice['solana']?.price || 0;

        return {
          walletId: wallet.getID(),
          walletType: type,
          name: wallet.getLabel(),
          address,
          chain: 'Solana',
          chainId: 101,
          balance: solAmount.toString(),
          balanceUSD: solAmount * (priceUsd || 0),
          symbol: 'SOL',
        };
      } catch (error) {
        console.error('Error fetching SOL balance:', error);
        return null;
      }
    }

    return null;
  }

  private calculateAssetBreakdown(
    wallets: WalletBalance[],
    totalValue: number,
  ): AssetAllocation[] {
    const assetMap = new Map<string, AssetAllocation>();

    for (const wallet of wallets) {
      const key = `${wallet.symbol}`;
      
      if (assetMap.has(key)) {
        const existing = assetMap.get(key)!;
        existing.valueUSD += wallet.balanceUSD;
      } else {
        assetMap.set(key, {
          name: wallet.chain,
          symbol: wallet.symbol,
          valueUSD: wallet.balanceUSD,
          percentage: 0,
          chain: wallet.chain,
        });
      }
    }

    // Calculate percentages
    const breakdown = Array.from(assetMap.values());
    breakdown.forEach(asset => {
      asset.percentage = totalValue > 0 ? (asset.valueUSD / totalValue) * 100 : 0;
    });

    return breakdown.sort((a, b) => b.valueUSD - a.valueUSD);
  }

  /**
   * Get quick stats
   */
  async getQuickStats(wallets: any[]): Promise<{
    totalValue: number;
    walletCount: number;
    assetCount: number;
    topAsset: string;
  }> {
    const summary = await this.getPortfolioSummary(wallets);
    
    return {
      totalValue: summary.totalValueUSD,
      walletCount: wallets.length,
      assetCount: summary.assetBreakdown.length,
      topAsset: summary.topAssets[0]?.symbol || 'N/A',
    };
  }

  /**
   * Clear cache
   */
  async clearCache(): Promise<void> {
    await AsyncStorage.removeItem(CACHE_KEY);
  }
}

export default PortfolioHomepageService.getInstance();
