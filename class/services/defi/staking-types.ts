// Copyright (C) 2026 MalinWallet Infrastructure - All Rights Reserved

/**
 * Staking Types & Interfaces
 * Supports ETH (Lido) and Solana (Native) staking
 */

export interface StakingPosition {
  id: string;
  protocol: 'lido' | 'solana' | 'rocketpool';
  asset: string; // 'ETH', 'SOL'
  stakedAmount: number;
  rewardAmount: number;
  apr: number;
  apy: number;
  status: 'active' | 'unstaking' | 'cooldown';
  stakedAt: number;
  unstakingAt?: number;
  cooldownEnd?: number;
  validatorAddress?: string;
}

export interface StakingOpportunity {
  protocol: string;
  asset: string;
  minStake: number;
  maxStake?: number;
  apr: number;
  apy: number;
  lockupPeriod: number; // Days
  cooldownPeriod: number; // Days
  tvl: number; // Total Value Locked
  description: string;
  risks: string[];
  benefits: string[];
}

export interface StakingRewards {
  totalEarned: number;
  totalEarnedUSD: number;
  pendingRewards: number;
  pendingRewardsUSD: number;
  claimedRewards: number;
  claimedRewardsUSD: number;
  lastClaimAt?: number;
}

export interface StakingValidator {
  address: string;
  name?: string;
  commission: number; // Percentage
  apr: number;
  totalStaked: number;
  active: boolean;
  voteCreditRatio?: number; // Solana specific
}

export interface StakeRequest {
  protocol: 'lido' | 'solana' | 'rocketpool';
  asset: string;
  amount: number;
  validatorAddress?: string; // For Solana
}

export interface UnstakeRequest {
  positionId: string;
  amount: number; // Partial unstake support
}

export interface ClaimRewardsRequest {
  positionId: string;
}

export interface StakingStats {
  totalStaked: number;
  totalStakedUSD: number;
  totalRewards: number;
  totalRewardsUSD: number;
  activePositions: number;
  averageAPY: number;
}
