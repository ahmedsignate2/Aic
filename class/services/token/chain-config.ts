// Copyright (C) 2026 MalinWallet Infrastructure - All Rights Reserved
import { Chain, ChainId } from './types';

/**
 * Multi-chain configuration with RPC URLs and metadata
 */
export const CHAIN_CONFIG: Record<ChainId, Chain> = {
  [ChainId.ETHEREUM]: {
    id: ChainId.ETHEREUM,
    name: 'Ethereum',
    symbol: 'ETH',
    rpcUrl: 'https://eth-mainnet.g.alchemy.com/v2/',
    explorerUrl: 'https://etherscan.io',
    logo: 'https://cryptologos.cc/logos/ethereum-eth-logo.png',
    isEVM: true,
    color: '#627EEA',
    coingeckoId: 'ethereum',
  },
  [ChainId.POLYGON]: {
    id: ChainId.POLYGON,
    name: 'Polygon',
    symbol: 'MATIC',
    rpcUrl: 'https://polygon-mainnet.g.alchemy.com/v2/',
    explorerUrl: 'https://polygonscan.com',
    logo: 'https://cryptologos.cc/logos/polygon-matic-logo.png',
    isEVM: true,
    color: '#8247E5',
    coingeckoId: 'matic-network',
  },
  [ChainId.BSC]: {
    id: ChainId.BSC,
    name: 'BNB Smart Chain',
    symbol: 'BNB',
    rpcUrl: 'https://bsc-dataseed.binance.org',
    explorerUrl: 'https://bscscan.com',
    logo: 'https://cryptologos.cc/logos/bnb-bnb-logo.png',
    isEVM: true,
    color: '#F3BA2F',
    coingeckoId: 'binancecoin',
  },
  [ChainId.ARBITRUM]: {
    id: ChainId.ARBITRUM,
    name: 'Arbitrum',
    symbol: 'ETH',
    rpcUrl: 'https://arb-mainnet.g.alchemy.com/v2/',
    explorerUrl: 'https://arbiscan.io',
    logo: 'https://cryptologos.cc/logos/arbitrum-arb-logo.png',
    isEVM: true,
    color: '#28A0F0',
    coingeckoId: 'ethereum', // Uses ETH as native
  },
  [ChainId.OPTIMISM]: {
    id: ChainId.OPTIMISM,
    name: 'Optimism',
    symbol: 'ETH',
    rpcUrl: 'https://opt-mainnet.g.alchemy.com/v2/',
    explorerUrl: 'https://optimistic.etherscan.io',
    logo: 'https://cryptologos.cc/logos/optimism-ethereum-op-logo.png',
    isEVM: true,
    color: '#FF0420',
    coingeckoId: 'ethereum', // Uses ETH as native
  },
  [ChainId.AVALANCHE]: {
    id: ChainId.AVALANCHE,
    name: 'Avalanche',
    symbol: 'AVAX',
    rpcUrl: 'https://api.avax.network/ext/bc/C/rpc',
    explorerUrl: 'https://snowtrace.io',
    logo: 'https://cryptologos.cc/logos/avalanche-avax-logo.png',
    isEVM: true,
    color: '#E84142',
    coingeckoId: 'avalanche-2',
  },
  [ChainId.ZKSYNC]: {
    id: ChainId.ZKSYNC,
    name: 'zkSync Era',
    symbol: 'ETH',
    rpcUrl: 'https://mainnet.era.zksync.io',
    explorerUrl: 'https://explorer.zksync.io',
    logo: 'https://cryptologos.cc/logos/zksync-zk-logo.png',
    isEVM: true,
    color: '#8C8DFC',
    coingeckoId: 'ethereum', // Uses ETH as native
  },
  [ChainId.COSMOS]: {
    id: ChainId.COSMOS,
    name: 'Cosmos Hub',
    symbol: 'ATOM',
    rpcUrl: 'https://cosmos-rpc.polkachu.com',
    explorerUrl: 'https://www.mintscan.io/cosmos',
    logo: 'https://cryptologos.cc/logos/cosmos-atom-logo.png',
    isEVM: false,
    color: '#2E3148',
    coingeckoId: 'cosmos',
  },
  [ChainId.SOLANA]: {
    id: ChainId.SOLANA,
    name: 'Solana',
    symbol: 'SOL',
    rpcUrl: 'https://api.mainnet-beta.solana.com',
    explorerUrl: 'https://solscan.io',
    logo: 'https://cryptologos.cc/logos/solana-sol-logo.png',
    isEVM: false,
    color: '#14F195',
    coingeckoId: 'solana',
  },
};

/**
 * Get chain configuration by ID
 */
export const getChainConfig = (chainId: ChainId): Chain => {
  return CHAIN_CONFIG[chainId];
};

/**
 * Get all supported chains
 */
export const getAllChains = (): Chain[] => {
  return Object.values(CHAIN_CONFIG);
};

/**
 * Get all EVM chains
 */
export const getEVMChains = (): Chain[] => {
  return getAllChains().filter(chain => chain.isEVM);
};

/**
 * Get chain ID from name
 */
export const getChainIdByName = (name: string): ChainId | undefined => {
  const chain = getAllChains().find(
    c => c.name.toLowerCase() === name.toLowerCase()
  );
  return chain?.id;
};

/**
 * Format chain ID for Alchemy API
 * Maps internal ChainId to Alchemy network names
 */
export const getAlchemyNetwork = (chainId: ChainId): string => {
  const mapping: Record<string, string> = {
    [ChainId.ETHEREUM]: 'eth-mainnet',
    [ChainId.POLYGON]: 'polygon-mainnet',
    [ChainId.ARBITRUM]: 'arb-mainnet',
    [ChainId.OPTIMISM]: 'opt-mainnet',
  };
  return mapping[chainId] || 'eth-mainnet';
};

/**
 * Get RPC URL with API key injection
 */
export const getRpcUrl = (chainId: ChainId, apiKey?: string): string => {
  const chain = getChainConfig(chainId);
  
  // Alchemy chains need API key
  if (apiKey && chain.rpcUrl.includes('alchemy.com')) {
    return `${chain.rpcUrl}${apiKey}`;
  }
  
  return chain.rpcUrl;
};

/**
 * Common ERC-20 tokens across chains
 * Pre-configured list of popular tokens
 */
export const COMMON_TOKENS: Partial<Record<ChainId, any[]>> = {
  [ChainId.ETHEREUM]: [
    {
      address: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
      symbol: 'USDT',
      name: 'Tether USD',
      decimals: 6,
      coingeckoId: 'tether',
      logo: 'https://cryptologos.cc/logos/tether-usdt-logo.png',
    },
    {
      address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
      symbol: 'USDC',
      name: 'USD Coin',
      decimals: 6,
      coingeckoId: 'usd-coin',
      logo: 'https://cryptologos.cc/logos/usd-coin-usdc-logo.png',
    },
    {
      address: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
      symbol: 'DAI',
      name: 'Dai Stablecoin',
      decimals: 18,
      coingeckoId: 'dai',
      logo: 'https://cryptologos.cc/logos/multi-collateral-dai-dai-logo.png',
    },
    {
      address: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599',
      symbol: 'WBTC',
      name: 'Wrapped Bitcoin',
      decimals: 8,
      coingeckoId: 'wrapped-bitcoin',
      logo: 'https://cryptologos.cc/logos/wrapped-bitcoin-wbtc-logo.png',
    },
  ],
  [ChainId.POLYGON]: [
    {
      address: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F',
      symbol: 'USDT',
      name: 'Tether USD',
      decimals: 6,
      coingeckoId: 'tether',
    },
    {
      address: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174',
      symbol: 'USDC',
      name: 'USD Coin',
      decimals: 6,
      coingeckoId: 'usd-coin',
    },
  ],
  [ChainId.BSC]: [
    {
      address: '0x55d398326f99059fF775485246999027B3197955',
      symbol: 'USDT',
      name: 'Tether USD',
      decimals: 18,
      coingeckoId: 'tether',
    },
    {
      address: '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d',
      symbol: 'USDC',
      name: 'USD Coin',
      decimals: 18,
      coingeckoId: 'usd-coin',
    },
  ],
  [ChainId.ARBITRUM]: [],
  [ChainId.OPTIMISM]: [],
  [ChainId.AVALANCHE]: [],
  [ChainId.SOLANA]: [],
};
