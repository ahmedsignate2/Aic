// Copyright (C) 2026 MalinWallet Infrastructure - All Rights Reserved
import { Token, ChainId, BridgeRoute } from './token/types';

/**
 * Bridge Service using Socket API for cross-chain transfers
 * Docs: https://docs.socket.tech/
 */
export class BridgeService {
  private static BASE_URL = 'https://api.socket.tech/v2';
  // Note: Socket API is free for up to 100 requests/day without API key
  // For production, get API key from https://socket.tech/

  /**
   * Get available bridge routes for token transfer
   */
  static async getRoutes(
    fromChainId: ChainId,
    toChainId: ChainId,
    fromToken: Token,
    amount: string,
    userAddress: string
  ): Promise<BridgeRoute[]> {
    try {
      const params = new URLSearchParams({
        fromChainId: fromChainId.toString(),
        toChainId: toChainId.toString(),
        fromTokenAddress: fromToken.address === 'native' ? '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee' : fromToken.address,
        toTokenAddress: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee', // Native on destination
        fromAmount: amount,
        userAddress,
        uniqueRoutesPerBridge: 'true',
        sort: 'output',
      });

      const response = await fetch(`${this.BASE_URL}/quote?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error(`Socket API error: ${response.statusText}`);
      }

      const data = await response.json();
      
      // Transform Socket routes to our format
      const routes: BridgeRoute[] = [];
      for (const route of data.result.routes || []) {
        routes.push({
          id: route.routeId,
          fromChainId,
          toChainId,
          fromToken,
          toToken: {
            ...fromToken,
            chainId: toChainId,
          },
          fromAmount: amount,
          toAmount: route.toAmount,
          estimatedTime: route.serviceTime || 300, // seconds
          gasFee: route.gasFees?.gasAmount || '0',
          bridgeFee: route.totalUserTx?.[0]?.totalGasFeesInUsd || '0',
          totalFeeUSD: parseFloat(route.totalGasFeesInUsd || '0'),
          provider: route.usedBridgeNames?.[0] || 'Socket',
          steps: route.userTxs?.map((tx: any) => ({
            type: tx.txType === 'approve' ? 'approval' : tx.txType === 'fund-movr' ? 'bridge' : 'swap',
            protocol: tx.protocol?.displayName || 'Unknown',
            fromToken,
            toToken: fromToken,
            fromAmount: tx.fromAmount,
            toAmount: tx.toAmount,
          })) || [],
        });
      }

      return routes;
    } catch (error) {
      console.error('Error fetching bridge routes:', error);
      return [];
    }
  }

  /**
   * Execute bridge transaction
   */
  static async executeBridge(
    route: BridgeRoute,
    userAddress: string
  ): Promise<string> {
    try {
      // Get transaction data from Socket
      const response = await fetch(`${this.BASE_URL}/build-tx`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          route: {
            routeId: route.id,
          },
          userAddress,
        }),
      });

      if (!response.ok) {
        throw new Error(`Socket API error: ${response.statusText}`);
      }

      const data = await response.json();
      
      // Return transaction data for signing
      return data.result.txData;
    } catch (error) {
      console.error('Error executing bridge:', error);
      throw error;
    }
  }

  /**
   * Get bridge status
   */
  static async getBridgeStatus(transactionHash: string, fromChainId: ChainId): Promise<any> {
    try {
      const params = new URLSearchParams({
        transactionHash,
        fromChainId: fromChainId.toString(),
      });

      const response = await fetch(`${this.BASE_URL}/bridge-status?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error(`Socket API error: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching bridge status:', error);
      return null;
    }
  }

  /**
   * Get supported chains for bridging
   */
  static async getSupportedChains(): Promise<ChainId[]> {
    try {
      const response = await fetch(`${this.BASE_URL}/supported/chains`);
      
      if (!response.ok) {
        return [ChainId.ETHEREUM, ChainId.POLYGON, ChainId.BSC, ChainId.ARBITRUM, ChainId.OPTIMISM];
      }

      const data = await response.json();
      return data.result.map((chain: any) => parseInt(chain.chainId));
    } catch (error) {
      console.error('Error fetching supported chains:', error);
      return [ChainId.ETHEREUM, ChainId.POLYGON, ChainId.BSC, ChainId.ARBITRUM, ChainId.OPTIMISM];
    }
  }
}
