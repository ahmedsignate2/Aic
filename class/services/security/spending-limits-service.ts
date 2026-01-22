/**
 * Spending Limits Service
 * Track and enforce spending limits
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  SpendingLimit,
  SpendingRecord,
  SpendingTransaction,
  LimitPeriod,
} from './types';

const LIMIT_KEY_PREFIX = '@malinwallet:spending:limit:';
const RECORD_KEY_PREFIX = '@malinwallet:spending:record:';

export class SpendingLimitsService {
  private static instance: SpendingLimitsService;

  private constructor() {}

  static getInstance(): SpendingLimitsService {
    if (!SpendingLimitsService.instance) {
      SpendingLimitsService.instance = new SpendingLimitsService();
    }
    return SpendingLimitsService.instance;
  }

  /**
   * Get spending limit for wallet
   */
  async getLimit(walletId: string, period: LimitPeriod): Promise<SpendingLimit | null> {
    try {
      const key = `${LIMIT_KEY_PREFIX}${walletId}:${period}`;
      const data = await AsyncStorage.getItem(key);
      if (data) {
        return JSON.parse(data);
      }
    } catch (error) {
      console.error('Error loading limit:', error);
    }
    return null;
  }

  /**
   * Get all limits for wallet
   */
  async getAllLimits(walletId: string): Promise<SpendingLimit[]> {
    const periods = [
      LimitPeriod.PER_TRANSACTION,
      LimitPeriod.DAILY,
      LimitPeriod.WEEKLY,
      LimitPeriod.MONTHLY,
    ];

    const limits: SpendingLimit[] = [];
    for (const period of periods) {
      const limit = await this.getLimit(walletId, period);
      if (limit) {
        limits.push(limit);
      }
    }
    return limits;
  }

  /**
   * Set spending limit
   */
  async setLimit(
    walletId: string,
    period: LimitPeriod,
    limitUSD: number,
    requirePIN: boolean = false,
  ): Promise<void> {
    const limit: SpendingLimit = {
      walletId,
      period,
      limitUSD,
      enabled: true,
      requirePIN,
    };

    const key = `${LIMIT_KEY_PREFIX}${walletId}:${period}`;
    await AsyncStorage.setItem(key, JSON.stringify(limit));
  }

  /**
   * Remove spending limit
   */
  async removeLimit(walletId: string, period: LimitPeriod): Promise<void> {
    const key = `${LIMIT_KEY_PREFIX}${walletId}:${period}`;
    await AsyncStorage.removeItem(key);
  }

  /**
   * Enable/disable limit
   */
  async toggleLimit(walletId: string, period: LimitPeriod, enabled: boolean): Promise<void> {
    const limit = await this.getLimit(walletId, period);
    if (limit) {
      limit.enabled = enabled;
      const key = `${LIMIT_KEY_PREFIX}${walletId}:${period}`;
      await AsyncStorage.setItem(key, JSON.stringify(limit));
    }
  }

  /**
   * Get spending record for period
   */
  async getRecord(walletId: string, period: LimitPeriod): Promise<SpendingRecord> {
    const { periodStart, periodEnd } = this.getPeriodRange(period);
    const key = `${RECORD_KEY_PREFIX}${walletId}:${period}:${periodStart}`;

    try {
      const data = await AsyncStorage.getItem(key);
      if (data) {
        const record: SpendingRecord = JSON.parse(data);
        // Clean up old transactions
        record.transactions = record.transactions.filter(tx => 
          tx.timestamp >= periodStart && tx.timestamp <= periodEnd
        );
        record.spentUSD = record.transactions.reduce((sum, tx) => sum + tx.amountUSD, 0);
        return record;
      }
    } catch (error) {
      console.error('Error loading record:', error);
    }

    // Create new record
    return {
      walletId,
      period,
      periodStart,
      periodEnd,
      spentUSD: 0,
      transactions: [],
    };
  }

  /**
   * Record a transaction
   */
  async recordTransaction(
    walletId: string,
    transaction: SpendingTransaction,
  ): Promise<void> {
    const periods = [
      LimitPeriod.DAILY,
      LimitPeriod.WEEKLY,
      LimitPeriod.MONTHLY,
    ];

    for (const period of periods) {
      const record = await this.getRecord(walletId, period);
      record.transactions.push(transaction);
      record.spentUSD += transaction.amountUSD;

      const { periodStart } = this.getPeriodRange(period);
      const key = `${RECORD_KEY_PREFIX}${walletId}:${period}:${periodStart}`;
      await AsyncStorage.setItem(key, JSON.stringify(record));
    }
  }

  /**
   * Check if transaction is within limits
   */
  async checkLimits(
    walletId: string,
    amountUSD: number,
  ): Promise<{ allowed: boolean; violations: string[] }> {
    const violations: string[] = [];

    // Check per-transaction limit
    const perTxLimit = await this.getLimit(walletId, LimitPeriod.PER_TRANSACTION);
    if (perTxLimit?.enabled && amountUSD > perTxLimit.limitUSD) {
      violations.push(
        `Exceeds per-transaction limit of $${perTxLimit.limitUSD.toFixed(2)}`
      );
    }

    // Check daily limit
    const dailyLimit = await this.getLimit(walletId, LimitPeriod.DAILY);
    if (dailyLimit?.enabled) {
      const dailyRecord = await this.getRecord(walletId, LimitPeriod.DAILY);
      const newTotal = dailyRecord.spentUSD + amountUSD;
      if (newTotal > dailyLimit.limitUSD) {
        violations.push(
          `Exceeds daily limit: $${newTotal.toFixed(2)} / $${dailyLimit.limitUSD.toFixed(2)}`
        );
      }
    }

    // Check weekly limit
    const weeklyLimit = await this.getLimit(walletId, LimitPeriod.WEEKLY);
    if (weeklyLimit?.enabled) {
      const weeklyRecord = await this.getRecord(walletId, LimitPeriod.WEEKLY);
      const newTotal = weeklyRecord.spentUSD + amountUSD;
      if (newTotal > weeklyLimit.limitUSD) {
        violations.push(
          `Exceeds weekly limit: $${newTotal.toFixed(2)} / $${weeklyLimit.limitUSD.toFixed(2)}`
        );
      }
    }

    // Check monthly limit
    const monthlyLimit = await this.getLimit(walletId, LimitPeriod.MONTHLY);
    if (monthlyLimit?.enabled) {
      const monthlyRecord = await this.getRecord(walletId, LimitPeriod.MONTHLY);
      const newTotal = monthlyRecord.spentUSD + amountUSD;
      if (newTotal > monthlyLimit.limitUSD) {
        violations.push(
          `Exceeds monthly limit: $${newTotal.toFixed(2)} / $${monthlyLimit.limitUSD.toFixed(2)}`
        );
      }
    }

    return {
      allowed: violations.length === 0,
      violations,
    };
  }

  /**
   * Get remaining limit for period
   */
  async getRemainingLimit(walletId: string, period: LimitPeriod): Promise<number> {
    const limit = await this.getLimit(walletId, period);
    if (!limit?.enabled) {
      return Infinity;
    }

    if (period === LimitPeriod.PER_TRANSACTION) {
      return limit.limitUSD;
    }

    const record = await this.getRecord(walletId, period);
    return Math.max(0, limit.limitUSD - record.spentUSD);
  }

  private getPeriodRange(period: LimitPeriod): { periodStart: number; periodEnd: number } {
    const now = new Date();
    let periodStart: Date;
    let periodEnd: Date;

    switch (period) {
      case LimitPeriod.DAILY:
        periodStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        periodEnd = new Date(periodStart);
        periodEnd.setDate(periodEnd.getDate() + 1);
        break;

      case LimitPeriod.WEEKLY:
        const dayOfWeek = now.getDay();
        periodStart = new Date(now);
        periodStart.setDate(now.getDate() - dayOfWeek);
        periodStart.setHours(0, 0, 0, 0);
        periodEnd = new Date(periodStart);
        periodEnd.setDate(periodEnd.getDate() + 7);
        break;

      case LimitPeriod.MONTHLY:
        periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
        periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);
        break;

      case LimitPeriod.PER_TRANSACTION:
      default:
        periodStart = new Date(0);
        periodEnd = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
        break;
    }

    return {
      periodStart: periodStart.getTime(),
      periodEnd: periodEnd.getTime(),
    };
  }

  /**
   * Clear old records
   */
  async clearOldRecords(): Promise<void> {
    const keys = await AsyncStorage.getAllKeys();
    const recordKeys = keys.filter(key => key.startsWith(RECORD_KEY_PREFIX));

    const now = Date.now();
    const retentionPeriod = 90 * 24 * 60 * 60 * 1000; // 90 days

    for (const key of recordKeys) {
      try {
        const data = await AsyncStorage.getItem(key);
        if (data) {
          const record: SpendingRecord = JSON.parse(data);
          if (record.periodEnd < now - retentionPeriod) {
            await AsyncStorage.removeItem(key);
          }
        }
      } catch (error) {
        console.error('Error cleaning record:', error);
      }
    }
  }

  /**
   * Clear all data
   */
  async clearAll(): Promise<void> {
    const keys = await AsyncStorage.getAllKeys();
    const limitKeys = keys.filter(key => key.startsWith(LIMIT_KEY_PREFIX));
    const recordKeys = keys.filter(key => key.startsWith(RECORD_KEY_PREFIX));
    await AsyncStorage.multiRemove([...limitKeys, ...recordKeys]);
  }
}

export default SpendingLimitsService.getInstance();
