// Copyright (C) 2026 MalinWallet Infrastructure - All Rights Reserved

/**
 * Supported blockchain chains
 */
export enum ChainId {
  ETHEREUM = 1,
  POLYGON = 137,
  BSC = 56,
  ARBITRUM = 42161,
  OPTIMISM = 10,
  AVALANCHE = 43114,
  ZKSYNC = 324,
  SOLANA = 'solana',
  COSMOS = 'cosmoshub-4',
}

/**
 * Chain metadata
 */
export interface Chain {
  id: ChainId;
  name: string;
  symbol: string; // Native token symbol (ETH, MATIC, BNB, etc.)
  rpcUrl: string;
  explorerUrl: string;
  logo: string;
  isEVM: boolean;
  color: string; // Brand color for UI
  coingeckoId: string; // For price fetching
}

/**
 * Token standard types
 */
export enum TokenStandard {
  ERC20 = 'ERC20',
  SPL = 'SPL',
  NATIVE = 'NATIVE',
}

/**
 * Token metadata
 */
export interface Token {
  // Identity
  address: string; // Contract address (0x... for EVM, mint for Solana)
  symbol: string;
  name: string;
  decimals: number;
  
  // Metadata
  logo?: string;
  standard: TokenStandard;
  chainId: ChainId;
  
  // Market data
  price?: number; // USD price
  priceChange24h?: number; // Percentage
  marketCap?: number;
  
  // User data
  balance?: string; // Raw balance (wei, lamports, etc.)
  balanceFormatted?: string; // Human-readable balance
  balanceUSD?: number; // Balance in USD
  
  // Additional
  verified?: boolean; // Is this a verified/trusted token
  coingeckoId?: string; // CoinGecko token ID for price fetching
  hidden?: boolean; // User preference to hide
  isNative?: boolean; // Is this the native chain token (ETH, BNB, etc.)
}

/**
 * Token balance response from APIs
 */
export interface TokenBalance {
  contractAddress: string;
  balance: string; // Raw balance string
  decimals: number;
  symbol?: string;
  name?: string;
  logo?: string;
  possibleSpam?: boolean;
}

/**
 * Portfolio summary
 */
export interface Portfolio {
  totalValueUSD: number;
  change24h: number; // Percentage
  change24hUSD: number; // Absolute USD change
  tokens: Token[];
  lastUpdated: number; // Timestamp
}

/**
 * Token fetch options
 */
export interface TokenFetchOptions {
  address: string; // Wallet address
  chainId: ChainId;
  includeNative?: boolean; // Include native token (ETH, BNB, etc.)
  includeSpam?: boolean; // Include spam tokens
}

/**
 * Price fetch options
 */
export interface PriceFetchOptions {
  symbols?: string[]; // Token symbols
  coingeckoIds?: string[]; // CoinGecko IDs
  vsCurrency?: string; // Default: 'usd'
  includeMarketCap?: boolean;
  include24hrChange?: boolean;
}

/**
 * Custom token to add
 */
export interface CustomToken {
  address: string;
  chainId: ChainId;
  symbol?: string;
  name?: string;
  decimals?: number;
  logo?: string;
}

/**
 * Bridge route option
 */
export interface BridgeRoute {
  id: string;
  fromChainId: ChainId;
  toChainId: ChainId;
  fromToken: Token;
  toToken: Token;
  fromAmount: string;
  toAmount: string;
  estimatedTime: number; // seconds
  gasFee: string;
  bridgeFee: string;
  totalFeeUSD: number;
  provider: string; // 'socket', 'lifi', etc.
  steps: BridgeStep[];
}

/**
 * Bridge transaction step
 */
export interface BridgeStep {
  type: 'swap' | 'bridge' | 'approval';
  protocol: string;
  fromToken: Token;
  toToken: Token;
  fromAmount: string;
  toAmount: string;
}

/**
 * Token cache entry
 */
export interface TokenCache {
  tokens: Token[];
  timestamp: number;
  address: string;
  chainId: ChainId;
}

/**
 * Price cache entry
 */
export interface PriceCache {
  [coingeckoId: string]: {
    price: number;
    change24h: number;
    timestamp: number;
  };
}
