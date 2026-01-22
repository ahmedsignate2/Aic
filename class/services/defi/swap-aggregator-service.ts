// Copyright (C) 2026 MalinWallet Infrastructure - All Rights Reserved
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CHAIN_CONFIG } from '../token/chain-config';
import {
  SwapRoute,
  SwapQuoteRequest,
  SwapQuoteResponse,
  SwapExecutionRequest,
  SwapExecutionResult,
  OneInchQuoteResponse,
  OneInchSwapResponse,
  JupiterQuoteResponse,
  SwapStep,
} from './swap-aggregator-types';

/**
 * Swap Aggregator Service
 * Integrates 1inch (EVM) and Jupiter (Solana) for best swap rates
 */
export class SwapAggregatorService {
  private static instance: SwapAggregatorService;
  
  private readonly ONEINCH_API_URL = 'https://api.1inch.dev/swap/v5.2';
  private readonly JUPITER_API_URL = 'https://quote-api.jup.ag/v6';
  private readonly CACHE_KEY = '@malinwallet:swap_quotes';
  private readonly CACHE_DURATION = 30 * 1000; // 30 seconds
  
  private defaultSlippage = 0.5; // 0.5%
  private maxPriceImpact = 5.0; // 5%

  private constructor() {}

  public static getInstance(): SwapAggregatorService {
    if (!SwapAggregatorService.instance) {
      SwapAggregatorService.instance = new SwapAggregatorService();
    }
    return SwapAggregatorService.instance;
  }

  /**
   * Get swap quotes from all aggregators
   */
  public async getSwapQuotes(request: SwapQuoteRequest): Promise<SwapQuoteResponse> {
    try {
      // Check cache first
      const cached = await this.getCachedQuotes(request);
      if (cached) {
        return cached;
      }

      const routes: SwapRoute[] = [];

      // Solana: Use Jupiter
      if (request.chainId === 101 || request.chainId === 102) {
        const jupiterRoutes = await this.getJupiterQuotes(request);
        routes.push(...jupiterRoutes);
      } else {
        // EVM: Use 1inch
        const oneInchRoutes = await this.getOneInchQuotes(request);
        routes.push(...oneInchRoutes);
      }

      // Sort by output amount (highest first)
      routes.sort((a, b) => parseFloat(b.toToken.amount) - parseFloat(a.toToken.amount));

      const response: SwapQuoteResponse = {
        routes,
        bestRoute: routes[0],
        timestamp: Date.now(),
      };

      // Cache response
      await this.cacheQuotes(request, response);

      return response;
    } catch (error) {
      console.error('Error getting swap quotes:', error);
      throw error;
    }
  }

  /**
   * Get quotes from 1inch (EVM chains)
   */
  private async getOneInchQuotes(request: SwapQuoteRequest): Promise<SwapRoute[]> {
    try {
      const { chainId, fromTokenAddress, toTokenAddress, amount, slippage, userAddress } = request;

      // 1inch uses chain IDs directly (1 for Ethereum, 137 for Polygon, etc.)
      const url = `${this.ONEINCH_API_URL}/${chainId}/quote`;
      const params = new URLSearchParams({
        fromTokenAddress,
        toTokenAddress,
        amount,
        // No API key needed for quote
      });

      const response = await fetch(`${url}?${params}`);
      
      if (!response.ok) {
        throw new Error(`1inch API error: ${response.statusText}`);
      }

      const data: OneInchQuoteResponse = await response.json();

      // Parse protocols/route
      const route: SwapStep[] = this.parseOneInchProtocols(data.protocols);

      // Get token info from chain config
      const chain = (CHAIN_CONFIG as any).find((c: any) => c.chainId === chainId);
      if (!chain) {
        throw new Error(`Unsupported chain: ${chainId}`);
      }

      // Calculate exchange rate
      const exchangeRate = parseFloat(data.toTokenAmount) / parseFloat(amount);

      const swapRoute: SwapRoute = {
        id: `1inch-${Date.now()}`,
        aggregator: 'oneInch',
        fromToken: {
          address: fromTokenAddress,
          symbol: 'FROM', // Should fetch from token list
          decimals: 18,
          amount,
        },
        toToken: {
          address: toTokenAddress,
          symbol: 'TO',
          decimals: 18,
          amount: data.toTokenAmount,
        },
        exchangeRate,
        priceImpact: 0, // 1inch doesn't provide this in quote
        gasFee: {
          estimated: data.estimatedGas,
          usd: 0, // Calculate based on gas price
        },
        route,
        estimatedTime: 30,
        slippage: slippage || this.defaultSlippage,
      };

      return [swapRoute];
    } catch (error) {
      console.error('Error getting 1inch quotes:', error);
      return [];
    }
  }

  /**
   * Get quotes from Jupiter (Solana)
   */
  private async getJupiterQuotes(request: SwapQuoteRequest): Promise<SwapRoute[]> {
    try {
      const { fromTokenAddress, toTokenAddress, amount, slippage } = request;

      const url = `${this.JUPITER_API_URL}/quote`;
      const params = new URLSearchParams({
        inputMint: fromTokenAddress,
        outputMint: toTokenAddress,
        amount,
        slippageBps: Math.floor((slippage || this.defaultSlippage) * 100).toString(),
        onlyDirectRoutes: 'false',
      });

      const response = await fetch(`${url}?${params}`);
      
      if (!response.ok) {
        throw new Error(`Jupiter API error: ${response.statusText}`);
      }

      const data: JupiterQuoteResponse = await response.json();

      // Transform Jupiter quotes to our format
      const routes: SwapRoute[] = data.data.slice(0, 3).map((quote, index) => {
        const route: SwapStep[] = quote.routePlan.map(step => ({
          protocol: step.swapInfo.label,
          fromToken: step.swapInfo.inputMint,
          toToken: step.swapInfo.outputMint,
          percentage: step.percent,
        }));

        const exchangeRate = parseFloat(quote.outAmount) / parseFloat(amount);

        return {
          id: `jupiter-${index}-${Date.now()}`,
          aggregator: 'jupiter',
          fromToken: {
            address: fromTokenAddress,
            symbol: 'FROM',
            decimals: 9, // SOL default
            amount,
          },
          toToken: {
            address: toTokenAddress,
            symbol: 'TO',
            decimals: 9,
            amount: quote.outAmount.toString(),
          },
          exchangeRate,
          priceImpact: parseFloat(quote.priceImpactPct),
          gasFee: {
            estimated: '0.000005', // ~5000 lamports
            usd: 0,
          },
          route,
          estimatedTime: 15,
          slippage: slippage || this.defaultSlippage,
        };
      });

      return routes;
    } catch (error) {
      console.error('Error getting Jupiter quotes:', error);
      return [];
    }
  }

  /**
   * Execute swap transaction
   */
  public async executeSwap(
    request: SwapExecutionRequest,
    wallet: any // EthereumWallet or SolanaWallet
  ): Promise<SwapExecutionResult> {
    try {
      const { route } = request;

      if (route.aggregator === 'jupiter') {
        return await this.executeJupiterSwap(request, wallet);
      } else if (route.aggregator === 'oneInch') {
        return await this.executeOneInchSwap(request, wallet);
      }

      throw new Error(`Unsupported aggregator: ${route.aggregator}`);
    } catch (error) {
      console.error('Error executing swap:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Execute 1inch swap
   */
  private async executeOneInchSwap(
    request: SwapExecutionRequest,
    wallet: any
  ): Promise<SwapExecutionResult> {
    try {
      const { route, userAddress, maxSlippage } = request;

      // Get swap transaction from 1inch
      const chainId = 1; // Should get from route
      const url = `${this.ONEINCH_API_URL}/${chainId}/swap`;
      const params = new URLSearchParams({
        fromTokenAddress: route.fromToken.address,
        toTokenAddress: route.toToken.address,
        amount: route.fromToken.amount,
        fromAddress: userAddress,
        slippage: maxSlippage.toString(),
      });

      const response = await fetch(`${url}?${params}`);
      
      if (!response.ok) {
        throw new Error(`1inch swap API error: ${response.statusText}`);
      }

      const data: OneInchSwapResponse = await response.json();

      // Send transaction using wallet
      const tx = await wallet.sendTransaction(data.tx);
      const receipt = await tx.wait();

      return {
        success: true,
        txHash: receipt.hash,
        actualOutputAmount: data.toTokenAmount,
      };
    } catch (error) {
      console.error('Error executing 1inch swap:', error);
      throw error;
    }
  }

  /**
   * Execute Jupiter swap
   */
  private async executeJupiterSwap(
    request: SwapExecutionRequest,
    wallet: any
  ): Promise<SwapExecutionResult> {
    try {
      // Jupiter swap requires getting swap transaction first
      const url = `${this.JUPITER_API_URL}/swap`;
      
      // Get quote again to ensure fresh data
      const quoteUrl = `${this.JUPITER_API_URL}/quote`;
      const quoteParams = new URLSearchParams({
        inputMint: request.route.fromToken.address,
        outputMint: request.route.toToken.address,
        amount: request.route.fromToken.amount,
        slippageBps: Math.floor(request.maxSlippage * 100).toString(),
      });

      const quoteResponse = await fetch(`${quoteUrl}?${quoteParams}`);
      const quoteData = await quoteResponse.json();

      // Get swap transaction
      const swapResponse = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          quoteResponse: quoteData.data[0],
          userPublicKey: request.userAddress,
          wrapAndUnwrapSol: true,
        }),
      });

      const { swapTransaction } = await swapResponse.json();

      // Decode and sign transaction
      const txBuffer = Buffer.from(swapTransaction, 'base64');
      // Send with wallet
      const signature = await wallet.sendTransaction(txBuffer);

      return {
        success: true,
        txHash: signature,
        actualOutputAmount: request.route.toToken.amount,
      };
    } catch (error) {
      console.error('Error executing Jupiter swap:', error);
      throw error;
    }
  }

  /**
   * Parse 1inch protocols into route steps
   */
  private parseOneInchProtocols(protocols: any[]): SwapStep[] {
    const steps: SwapStep[] = [];

    protocols.forEach((protocolGroup) => {
      protocolGroup.forEach((protocol: any) => {
        protocol.forEach((route: any) => {
          steps.push({
            protocol: route.name,
            fromToken: route.fromTokenAddress,
            toToken: route.toTokenAddress,
            percentage: route.part,
          });
        });
      });
    });

    return steps;
  }

  /**
   * Cache swap quotes
   */
  private async cacheQuotes(request: SwapQuoteRequest, response: SwapQuoteResponse): Promise<void> {
    try {
      const key = this.getCacheKey(request);
      const data = {
        response,
        timestamp: Date.now(),
      };
      await AsyncStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      console.error('Error caching quotes:', error);
    }
  }

  /**
   * Get cached quotes
   */
  private async getCachedQuotes(request: SwapQuoteRequest): Promise<SwapQuoteResponse | null> {
    try {
      const key = this.getCacheKey(request);
      const cached = await AsyncStorage.getItem(key);
      
      if (!cached) return null;

      const data = JSON.parse(cached);
      const age = Date.now() - data.timestamp;

      if (age > this.CACHE_DURATION) {
        return null;
      }

      return data.response;
    } catch (error) {
      return null;
    }
  }

  /**
   * Generate cache key
   */
  private getCacheKey(request: SwapQuoteRequest): string {
    return `${this.CACHE_KEY}:${request.chainId}:${request.fromTokenAddress}:${request.toTokenAddress}:${request.amount}`;
  }

  /**
   * Set default slippage
   */
  public setDefaultSlippage(slippage: number): void {
    this.defaultSlippage = slippage;
  }

  /**
   * Get default slippage
   */
  public getDefaultSlippage(): number {
    return this.defaultSlippage;
  }
}
