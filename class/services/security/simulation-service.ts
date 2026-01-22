/**
 * Transaction Simulation Service
 * Preview transaction outcomes before sending
 */

import { ethers } from 'ethers';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SimulationResult, BalanceChange, SimulatedEvent } from './types';

const CACHE_KEY_PREFIX = '@malinwallet:simulation:';
const CACHE_DURATION = 30 * 1000; // 30 seconds

export class SimulationService {
  private static instance: SimulationService;

  private constructor() {}

  static getInstance(): SimulationService {
    if (!SimulationService.instance) {
      SimulationService.instance = new SimulationService();
    }
    return SimulationService.instance;
  }

  /**
   * Simulate transaction using eth_call
   */
  async simulateTransaction(
    from: string,
    to: string,
    value: string,
    data: string,
    chainId: number,
    rpcUrl: string,
  ): Promise<SimulationResult> {
    const cacheKey = `${CACHE_KEY_PREFIX}${chainId}:${from}:${to}:${value}:${data.slice(0, 20)}`;

    // Check cache
    try {
      const cached = await AsyncStorage.getItem(cacheKey);
      if (cached) {
        const { data: simData, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < CACHE_DURATION) {
          return simData;
        }
      }
    } catch (error) {
      console.log('Cache read error:', error);
    }

    // Simulate
    const result = await this.runSimulation(from, to, value, data, rpcUrl);

    // Cache result
    try {
      await AsyncStorage.setItem(
        cacheKey,
        JSON.stringify({ data: result, timestamp: Date.now() }),
      );
    } catch (error) {
      console.log('Cache write error:', error);
    }

    return result;
  }

  private async runSimulation(
    from: string,
    to: string,
    value: string,
    data: string,
    rpcUrl: string,
  ): Promise<SimulationResult> {
    const provider = new ethers.JsonRpcProvider(rpcUrl);

    try {
      // Get current balance
      const balanceBefore = await provider.getBalance(from);

      // Estimate gas
      const gasEstimate = await provider.estimateGas({
        from,
        to,
        value: ethers.parseEther(value || '0'),
        data: data || '0x',
      });

      // Get gas price
      const feeData = await provider.getFeeData();
      const gasPrice = feeData.gasPrice || ethers.parseUnits('20', 'gwei');

      // Calculate total cost
      const gasCost = gasEstimate * gasPrice;
      const txValue = ethers.parseEther(value || '0');
      const totalCost = gasCost + txValue;

      // Try to call the transaction
      let success = true;
      let error: string | undefined;
      const warnings: string[] = [];

      try {
        await provider.call({
          from,
          to,
          value: txValue,
          data: data || '0x',
        });
      } catch (e: any) {
        success = false;
        error = e.message || 'Transaction will fail';
        warnings.push(`❌ Transaction will revert: ${error}`);
      }

      // Check if sender has enough balance
      if (totalCost > balanceBefore) {
        success = false;
        warnings.push('❌ Insufficient balance for transaction + gas');
      }

      // Calculate balance changes
      const balanceAfter = balanceBefore - totalCost;
      const balanceChanges: BalanceChange[] = [
        {
          address: from,
          before: ethers.formatEther(balanceBefore),
          after: ethers.formatEther(balanceAfter),
          change: ethers.formatEther(-totalCost),
        },
      ];

      if (txValue > 0n && to) {
        const recipientBalanceBefore = await provider.getBalance(to);
        balanceChanges.push({
          address: to,
          before: ethers.formatEther(recipientBalanceBefore),
          after: ethers.formatEther(recipientBalanceBefore + txValue),
          change: ethers.formatEther(txValue),
        });
      }

      // Parse data for additional info
      const events = this.parseTransactionData(data);

      // Add warnings based on data
      if (data && data.length > 10) {
        const selector = data.slice(0, 10);
        
        // Check for dangerous functions
        const dangerousFunctions: Record<string, string> = {
          '0x095ea7b3': 'approve() - Granting token approval',
          '0xa22cb465': 'setApprovalForAll() - Granting NFT approval',
          '0x23b872dd': 'transferFrom() - Token transfer',
          '0x42842e0e': 'safeTransferFrom() - NFT transfer',
        };

        if (dangerousFunctions[selector]) {
          warnings.push(`⚠️ ${dangerousFunctions[selector]}`);
        }
      }

      return {
        success,
        gasUsed: gasEstimate.toString(),
        gasPrice: ethers.formatUnits(gasPrice, 'gwei'),
        totalCost: ethers.formatEther(totalCost),
        balanceChanges,
        events,
        error,
        warnings,
      };
    } catch (error: any) {
      console.error('Simulation error:', error);
      return {
        success: false,
        gasUsed: '0',
        gasPrice: '0',
        totalCost: '0',
        balanceChanges: [],
        events: [],
        error: error.message || 'Simulation failed',
        warnings: ['❌ Unable to simulate transaction'],
      };
    }
  }

  private parseTransactionData(data: string): SimulatedEvent[] {
    if (!data || data === '0x' || data.length < 10) {
      return [];
    }

    const events: SimulatedEvent[] = [];
    const selector = data.slice(0, 10);

    // Known function signatures
    const signatures: Record<string, { name: string; params: string[] }> = {
      '0xa9059cbb': { name: 'transfer', params: ['address to', 'uint256 amount'] },
      '0x095ea7b3': { name: 'approve', params: ['address spender', 'uint256 amount'] },
      '0x23b872dd': { name: 'transferFrom', params: ['address from', 'address to', 'uint256 amount'] },
      '0xa22cb465': { name: 'setApprovalForAll', params: ['address operator', 'bool approved'] },
      '0x42842e0e': { name: 'safeTransferFrom', params: ['address from', 'address to', 'uint256 tokenId'] },
    };

    const sig = signatures[selector];
    if (sig) {
      events.push({
        name: sig.name,
        params: { selector, data: data.slice(10) },
        address: '',
      });
    }

    return events;
  }

  /**
   * Simulate token transfer
   */
  async simulateTokenTransfer(
    tokenAddress: string,
    from: string,
    to: string,
    amount: string,
    decimals: number,
    rpcUrl: string,
  ): Promise<SimulationResult> {
    // ERC20 transfer function signature
    const iface = new ethers.Interface([
      'function transfer(address to, uint256 amount) returns (bool)',
    ]);

    const data = iface.encodeFunctionData('transfer', [
      to,
      ethers.parseUnits(amount, decimals),
    ]);

    return this.simulateTransaction(from, tokenAddress, '0', data, 1, rpcUrl);
  }

  /**
   * Simulate token approval
   */
  async simulateTokenApproval(
    tokenAddress: string,
    owner: string,
    spender: string,
    amount: string,
    decimals: number,
    rpcUrl: string,
  ): Promise<SimulationResult> {
    const iface = new ethers.Interface([
      'function approve(address spender, uint256 amount) returns (bool)',
    ]);

    const data = iface.encodeFunctionData('approve', [
      spender,
      ethers.parseUnits(amount, decimals),
    ]);

    return this.simulateTransaction(owner, tokenAddress, '0', data, 1, rpcUrl);
  }

  /**
   * Clear cache
   */
  async clearCache(): Promise<void> {
    const keys = await AsyncStorage.getAllKeys();
    const simKeys = keys.filter(key => key.startsWith(CACHE_KEY_PREFIX));
    await AsyncStorage.multiRemove(simKeys);
  }
}

export default SimulationService.getInstance();
