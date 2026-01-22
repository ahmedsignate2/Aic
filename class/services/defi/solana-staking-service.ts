// Copyright (C) 2026 MalinWallet Infrastructure - All Rights Reserved
import { Connection, PublicKey, StakeProgram, Authorized, Lockup, LAMPORTS_PER_SOL } from '@solana/web3.js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  StakingPosition,
  StakingOpportunity,
  StakingRewards,
  StakingValidator,
  StakeRequest,
  UnstakeRequest,
} from './staking-types';

/**
 * Solana Staking Service
 * Native SOL staking with validators
 */
export class SolanaStakingService {
  private static instance: SolanaStakingService;
  
  private readonly SOLANA_RPC = 'https://api.mainnet-beta.solana.com';
  private readonly VALIDATORS_API = 'https://www.validators.app/api/v1/validators/mainnet.json';
  private readonly CACHE_KEY = '@malinwallet:sol_staking';
  private readonly CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

  private connection: Connection;

  private constructor() {
    this.connection = new Connection(this.SOLANA_RPC, 'confirmed');
  }

  public static getInstance(): SolanaStakingService {
    if (!SolanaStakingService.instance) {
      SolanaStakingService.instance = new SolanaStakingService();
    }
    return SolanaStakingService.instance;
  }

  /**
   * Get staking opportunities
   */
  public async getOpportunities(): Promise<StakingOpportunity[]> {
    try {
      return [
        {
          protocol: 'Solana Native',
          asset: 'SOL',
          minStake: 0.01,
          apr: 7.0, // Average network APR
          apy: 7.25,
          lockupPeriod: 0,
          cooldownPeriod: 2, // ~2-3 days epoch
          tvl: 400000000000, // ~$400B total staked
          description: 'Native Solana staking. Choose your validator.',
          risks: [
            'Validator risk (slashing)',
            'Epoch cooldown period',
            'No instant unstaking',
          ],
          benefits: [
            'No protocol fees',
            'Direct validator rewards',
            'Network security contribution',
            '~7% APY',
          ],
        },
      ];
    } catch (error) {
      console.error('Error getting SOL staking opportunities:', error);
      return [];
    }
  }

  /**
   * Get top validators
   */
  public async getTopValidators(limit: number = 10): Promise<StakingValidator[]> {
    try {
      // In production, fetch from validators.app or similar
      // For now, return mock data
      return [
        {
          address: 'Everstake...', // Simplified
          name: 'Everstake',
          commission: 5,
          apr: 7.2,
          totalStaked: 5000000,
          active: true,
          voteCreditRatio: 0.98,
        },
        {
          address: 'Chorus...One',
          name: 'Chorus One',
          commission: 8,
          apr: 7.0,
          totalStaked: 4500000,
          active: true,
          voteCreditRatio: 0.97,
        },
        // Add more validators
      ];
    } catch (error) {
      console.error('Error getting validators:', error);
      return [];
    }
  }

  /**
   * Stake SOL with a validator
   */
  public async stake(
    request: StakeRequest,
    wallet: any // SolanaWallet
  ): Promise<{ success: boolean; txHash?: string; error?: string }> {
    try {
      if (!request.validatorAddress) {
        throw new Error('Validator address required for Solana staking');
      }

      const fromPubkey = new PublicKey(wallet.getPublicKey());
      const votePubkey = new PublicKey(request.validatorAddress);

      // Create stake account
      const stakeAccount = new PublicKey('...'); // Generate new keypair

      // Get minimum rent for stake account
      const rentExemption = await this.connection.getMinimumBalanceForRentExemption(
        StakeProgram.space
      );

      // Create stake account instruction
      const createAccountIx = StakeProgram.createAccount({
        fromPubkey,
        stakePubkey: stakeAccount,
        authorized: new Authorized(fromPubkey, fromPubkey),
        lockup: new Lockup(0, 0, fromPubkey),
        lamports: rentExemption + (request.amount * LAMPORTS_PER_SOL),
      });

      // Delegate stake instruction
      const delegateIx = StakeProgram.delegate({
        stakePubkey: stakeAccount,
        authorizedPubkey: fromPubkey,
        votePubkey,
      });

      // Send transaction
      const { blockhash } = await this.connection.getLatestBlockhash();
      const tx = wallet.createTransaction();
      tx.add(createAccountIx, delegateIx);
      tx.recentBlockhash = blockhash;
      tx.feePayer = fromPubkey;

      const signature = await wallet.sendTransaction(tx);

      // Save position
      await this.savePosition({
        id: `solana-${Date.now()}`,
        protocol: 'solana',
        asset: 'SOL',
        stakedAmount: request.amount,
        rewardAmount: 0,
        apr: 7.0,
        apy: 7.25,
        status: 'active',
        stakedAt: Date.now(),
        validatorAddress: request.validatorAddress,
      });

      return {
        success: true,
        txHash: signature,
      };
    } catch (error) {
      console.error('Error staking SOL:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get staked balance
   */
  public async getStakedBalance(address: string): Promise<number> {
    try {
      const pubkey = new PublicKey(address);
      
      // Get all stake accounts for this wallet
      const stakeAccounts = await this.connection.getParsedProgramAccounts(
        StakeProgram.programId,
        {
          filters: [
            {
              memcmp: {
                offset: 12, // Staker authority offset
                bytes: pubkey.toBase58(),
              },
            },
          ],
        }
      );

      let totalStaked = 0;
      stakeAccounts.forEach(account => {
        const data = account.account.data as any;
        if (data.parsed?.info?.stake?.delegation) {
          totalStaked += data.parsed.info.stake.delegation.stake / LAMPORTS_PER_SOL;
        }
      });

      return totalStaked;
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
      const positions = await this.getPositions(address);
      
      let totalEarned = 0;
      positions.forEach(pos => {
        // Calculate rewards based on time staked and APR
        const daysStaked = (Date.now() - pos.stakedAt) / (1000 * 60 * 60 * 24);
        const dailyRate = pos.apr / 365 / 100;
        const rewards = pos.stakedAmount * dailyRate * daysStaked;
        totalEarned += rewards;
      });

      const solPrice = 120; // Should fetch real price

      return {
        totalEarned,
        totalEarnedUSD: totalEarned * solPrice,
        pendingRewards: totalEarned,
        pendingRewardsUSD: totalEarned * solPrice,
        claimedRewards: 0,
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
   * Unstake SOL
   */
  public async unstake(
    request: UnstakeRequest,
    wallet: any
  ): Promise<{ success: boolean; txHash?: string; error?: string }> {
    try {
      const positions = await this.getPositions(wallet.getPublicKey());
      const position = positions.find(p => p.id === request.positionId);

      if (!position) {
        throw new Error('Position not found');
      }

      const fromPubkey = new PublicKey(wallet.getPublicKey());
      const stakeAccount = new PublicKey('...'); // Get from position

      // Deactivate stake
      const deactivateIx = StakeProgram.deactivate({
        stakePubkey: stakeAccount,
        authorizedPubkey: fromPubkey,
      });

      // Send transaction
      const { blockhash } = await this.connection.getLatestBlockhash();
      const tx = wallet.createTransaction();
      tx.add(deactivateIx);
      tx.recentBlockhash = blockhash;
      tx.feePayer = fromPubkey;

      const signature = await wallet.sendTransaction(tx);

      // Update position status
      position.status = 'unstaking';
      position.unstakingAt = Date.now();
      position.cooldownEnd = Date.now() + (2 * 24 * 60 * 60 * 1000); // ~2 days
      await this.savePosition(position);

      return {
        success: true,
        txHash: signature,
      };
    } catch (error) {
      console.error('Error unstaking SOL:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Withdraw unstaked SOL (after cooldown)
   */
  public async withdraw(
    positionId: string,
    wallet: any
  ): Promise<{ success: boolean; txHash?: string; error?: string }> {
    try {
      const positions = await this.getPositions(wallet.getPublicKey());
      const position = positions.find(p => p.id === positionId);

      if (!position || position.status !== 'unstaking') {
        throw new Error('Position not ready for withdrawal');
      }

      if (position.cooldownEnd && Date.now() < position.cooldownEnd) {
        throw new Error('Cooldown period not complete');
      }

      const fromPubkey = new PublicKey(wallet.getPublicKey());
      const stakeAccount = new PublicKey('...'); // Get from position

      // Withdraw instruction
      const withdrawIx = StakeProgram.withdraw({
        stakePubkey: stakeAccount,
        authorizedPubkey: fromPubkey,
        toPubkey: fromPubkey,
        lamports: position.stakedAmount * LAMPORTS_PER_SOL,
      });

      // Send transaction
      const { blockhash } = await this.connection.getLatestBlockhash();
      const tx = wallet.createTransaction();
      tx.add(withdrawIx);
      tx.recentBlockhash = blockhash;
      tx.feePayer = fromPubkey;

      const signature = await wallet.sendTransaction(tx);

      // Remove position
      await this.removePosition(positionId);

      return {
        success: true,
        txHash: signature,
      };
    } catch (error) {
      console.error('Error withdrawing SOL:', error);
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
   * Remove position
   */
  private async removePosition(positionId: string): Promise<void> {
    try {
      const key = `${this.CACHE_KEY}:positions`;
      const existing = await AsyncStorage.getItem(key);
      const positions: StakingPosition[] = existing ? JSON.parse(existing) : [];

      const filtered = positions.filter(p => p.id !== positionId);
      await AsyncStorage.setItem(key, JSON.stringify(filtered));
    } catch (error) {
      console.error('Error removing position:', error);
    }
  }
}
