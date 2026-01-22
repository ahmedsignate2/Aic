// Copyright (C) 2026 MalinWallet Infrastructure - All Rights Reserved

/**
 * Swap Aggregator Types
 * Supports 1inch (EVM) and Jupiter (Solana)
 */

export interface SwapRoute {
  id: string;
  aggregator: 'oneInch' | 'jupiter' | 'native';
  fromToken: {
    address: string;
    symbol: string;
    decimals: number;
    amount: string; // Raw amount
  };
  toToken: {
    address: string;
    symbol: string;
    decimals: number;
    amount: string; // Estimated output
  };
  exchangeRate: number; // 1 fromToken = X toToken
  priceImpact: number; // Percentage
  gasFee: {
    estimated: string; // In native currency
    usd: number;
  };
  route: SwapStep[];
  aggregatorFee?: number; // Percentage
  estimatedTime: number; // Seconds
  slippage: number; // Percentage
}

export interface SwapStep {
  protocol: string; // 'Uniswap V3', 'Raydium', etc.
  fromToken: string;
  toToken: string;
  percentage: number; // % of total routed through this step
}

export interface SwapQuoteRequest {
  chainId: number;
  fromTokenAddress: string;
  toTokenAddress: string;
  amount: string; // Raw amount
  slippage: number; // 0.5 = 0.5%
  userAddress: string;
}

export interface SwapQuoteResponse {
  routes: SwapRoute[];
  bestRoute: SwapRoute;
  timestamp: number;
}

export interface SwapExecutionRequest {
  route: SwapRoute;
  userAddress: string;
  maxSlippage: number;
}

export interface SwapExecutionResult {
  success: boolean;
  txHash?: string;
  error?: string;
  actualOutputAmount?: string;
}

export interface OneInchQuoteResponse {
  toTokenAmount: string;
  fromTokenAmount: string;
  protocols: any[];
  estimatedGas: string;
}

export interface OneInchSwapResponse {
  tx: {
    from: string;
    to: string;
    data: string;
    value: string;
    gas: string;
    gasPrice: string;
  };
  toTokenAmount: string;
}

export interface JupiterQuoteResponse {
  data: Array<{
    inAmount: string;
    outAmount: string;
    priceImpactPct: string;
    marketInfos: Array<{
      id: string;
      label: string;
      inputMint: string;
      outputMint: string;
      notEnoughLiquidity: boolean;
      inAmount: string;
      outAmount: string;
      minInAmount?: string;
      minOutAmount?: string;
      lpFee: {
        amount: string;
        mint: string;
        pct: number;
      };
      platformFee: {
        amount: string;
        mint: string;
        pct: number;
      };
    }>;
    amount: string;
    slippageBps: number;
    otherAmountThreshold: string;
    swapMode: string;
    routePlan: Array<{
      swapInfo: {
        ammKey: string;
        label: string;
        inputMint: string;
        outputMint: string;
        inAmount: string;
        outAmount: string;
        feeAmount: string;
        feeMint: string;
      };
      percent: number;
    }>;
  }>;
}

export interface SwapAggregatorConfig {
  oneInchApiKey?: string;
  jupiterApiUrl: string;
  defaultSlippage: number;
  maxPriceImpact: number; // Reject if > this %
}
