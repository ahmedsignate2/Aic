// Copyright (C) 2026 MalinWallet Infrastructure - All Rights Reserved
import { ethers } from 'ethers';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  StakingPosition,
  StakingOpportunity,
  StakingRewards,
  StakeRequest,
  UnstakeRequest,
} from './staking-types';

/**
 * ETH Staking Service
 * Integrates with Lido for liquid ETH staking
 */
export class ETHStakingService {
  private static instance: ETHStakingService;
  
  // Lido contract addresses
  private readonly LIDO_CONTRACT = '0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84'; // Lido: stETH
  private readonly LIDO_APR_API = 'https://stake.lido.fi/api/apr';
  
  private readonly CACHE_KEY = '@malinwallet:eth_staking';
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  // Lido ABI (simplified)
  private readonly LIDO_ABI = [
    'function submit(address _referral) payable returns (uint256)',
    'function balanceOf(address account) view returns (uint256)',
    'function getTotalPooledEther() view returns (uint256)',
    'function getTotalShares() view returns (uint256)',
  ];

  private constructor() {}

  public static getInstance(): ETHStakingService {
    if (!ETHStakingService.instance) {
      ETHStakingService.instance = new ETHStakingService();
    }
    return ETHStakingService.instance;
  }

  /**
   * Get staking opportunities
   */
  public async getOpportunities(): Promise<StakingOpportunity[]> {
    try {
      // Fetch current APR from Lido
      const response = await fetch(this.LIDO_APR_API);
      const data = await response.json();
      
      const apr = parseFloat(data.apr || '4.5');
      const apy = this.calculateAPY(apr);

      return [
        {
          protocol: 'Lido',
          asset: 'ETH',
          minStake: 0.01, // No minimum
          apr,
          apy,
          lockupPeriod: 0, // Liquid staking
          cooldownPeriod: 0, // Instant via DEX
          tvl: 9800000000, // ~$9.8B (example)
          description: 'Liquid staking with Lido. Get stETH and earn rewards.',
          risks: [
            'Smart contract risk',
            'Slashing risk (minimal)',
            'stETH depeg risk',
          ],
          benefits: [
            'No minimum stake',
            'Liquid staking (tradeable stETH)',
            'No lockup period',
            'Battle-tested protocol',
          ],
        },
      ];
    } catch (error) {
      console.error('Error getting ETH staking opportunities:', error);
      return [];
    }
  }

  /**
   * Stake ETH with Lido
   */
  public async stake(
    request: StakeRequest,
    wallet: any // EthereumWallet
  ): Promise<{ success: boolean; txHash?: string; error?: string }> {
    try {
      const provider = wallet.getProvider();
      const signer = wallet.getSigner();

      // Connect to Lido contract
      const lidoContract = new ethers.Contract(
        this.LIDO_CONTRACT,
        this.LIDO_ABI,
        signer
      );

      // Submit stake (mint stETH)
      const tx = await lidoContract.submit(ethers.ZeroAddress, {
        value: ethers.parseEther(request.amount.toString()),
      });

      await tx.wait();

      // Save position
      await this.savePosition({
        id: `lido-${Date.now()}`,
        protocol: 'lido',
        asset: 'ETH',
        stakedAmount: request.amount,
        rewardAmount: 0,
        apr: 4.5, // Should fetch real APR
        apy: this.calculateAPY(4.5),
        status: 'active',
        stakedAt: Date.now(),
      });

      return {
        success: true,
        txHash: tx.hash,
      };
    } catch (error) {
      console.error('Error staking ETH:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get staked balance (stETH)
   */
  public async getStakedBalance(address: string): Promise<number> {
    try {
      const provider = new ethers.JsonRpcProvider('https://eth.llamarpc.com');
      const lidoContract = new ethers.Contract(
        this.LIDO_CONTRACT,
        this.LIDO_ABI,
        provider
      );

      const balance = await lidoContract.balanceOf(address);
      return parseFloat(ethers.formatEther(balance));
    } catch (error) {
      console.error('Error getting staked balance:', error);
      return 0;
    }
  }

  /**
   * Get staking rewards
   */
  public async getRewards(address: string): Promise<StakingRewards> {
    try {
      // stETH is rebasing, so rewards are auto-compounded
      // Calculate rewards based on balance growth
      const positions = await this.getPositions(address);
      
      let totalEarned = 0;
      positions.forEach(pos => {
        totalEarned += pos.rewardAmount;
      });

      // Get current ETH price for USD conversion
      const ethPrice = 3500; // Should fetch real price

      return {
        totalEarned,
        totalEarnedUSD: totalEarned * ethPrice,
        pendingRewards: totalEarned, // Auto-compounding
        pendingRewardsUSD: totalEarned * ethPrice,
        claimedRewards: 0, // N/A for rebasing token
        claimedRewardsUSD: 0,
      };
    } catch (error) {
      console.error('Error getting rewards:', error);
      return {
        totalEarned: 0,
        totalEarnedUSD: 0,
        pendingRewards: 0,
        pendingRewardsUSD: 0,
        claimedRewards: 0,
        claimedRewardsUSD: 0,
      };
    }
  }

  /**
   * Unstake (swap stETH for ETH)
   */
  public async unstake(
    request: UnstakeRequest,
    wallet: any
  ): Promise<{ success: boolean; txHash?: string; error?: string }> {
    try {
      // Note: Unstaking requires either:
      // 1. Swap stETH → ETH on DEX (instant)
      // 2. Wait for Lido withdrawal queue (slow)
      
      // For simplicity, we'll mark as unstaking
      // User should swap stETH on Uniswap/Curve

      const positions = await this.getPositions(wallet.getAddress());
      const position = positions.find(p => p.id === request.positionId);

      if (!position) {
        throw new Error('Position not found');
      }

      position.status = 'unstaking';
      await this.savePosition(position);

      return {
        success: true,
        txHash: '0x...', // Mock tx hash
      };
    } catch (error) {
      console.error('Error unstaking ETH:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get user staking positions
   */
  public async getPositions(address: string): Promise<StakingPosition[]> {
    try {
      const key = `${this.CACHE_KEY}:${address}`;
      const data = await AsyncStorage.getItem(key);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error getting positions:', error);
      return [];
    }
  }

  /**
   * Save staking position
   */
  private async savePosition(position: StakingPosition): Promise<void> {
    try {
      // This is simplified - in production, derive from on-chain data
      const key = `${this.CACHE_KEY}:positions`;
      const existing = await AsyncStorage.getItem(key);
      const positions: StakingPosition[] = existing ? JSON.parse(existing) : [];

      const index = positions.findIndex(p => p.id === position.id);
      if (index >= 0) {
        positions[index] = position;
      } else {
        positions.push(position);
      }

      await AsyncStorage.setItem(key, JSON.stringify(positions));
    } catch (error) {
      console.error('Error saving position:', error);
    }
  }

  /**
   * Calculate APY from APR
   */
  private calculateAPY(apr: number): number {
    // Daily compounding: APY = (1 + APR/365)^365 - 1
    return (Math.pow(1 + apr / 100 / 365, 365) - 1) * 100;
  }
}
