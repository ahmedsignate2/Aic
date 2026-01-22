/**
 * Address Whitelist Service
 * Manage trusted addresses
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { WhitelistEntry } from './types';

const STORAGE_KEY_PREFIX = '@malinwallet:whitelist:';

export class WhitelistService {
  private static instance: WhitelistService;

  private constructor() {}

  static getInstance(): WhitelistService {
    if (!WhitelistService.instance) {
      WhitelistService.instance = new WhitelistService();
    }
    return WhitelistService.instance;
  }

  /**
   * Get all whitelisted addresses for a wallet
   */
  async getWhitelist(walletId: string): Promise<WhitelistEntry[]> {
    try {
      const key = `${STORAGE_KEY_PREFIX}${walletId}`;
      const data = await AsyncStorage.getItem(key);
      if (data) {
        return JSON.parse(data);
      }
    } catch (error) {
      console.error('Error loading whitelist:', error);
    }
    return [];
  }

  /**
   * Add address to whitelist
   */
  async addAddress(
    walletId: string,
    address: string,
    label: string,
    note?: string,
    chainId?: number,
  ): Promise<void> {
    const whitelist = await this.getWhitelist(walletId);

    // Check if already exists
    const exists = whitelist.find(entry => 
      entry.address.toLowerCase() === address.toLowerCase() &&
      (entry.chainId === chainId || (!entry.chainId && !chainId))
    );

    if (exists) {
      throw new Error('Address already in whitelist');
    }

    const newEntry: WhitelistEntry = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      address,
      label,
      note,
      chainId,
      addedAt: Date.now(),
    };

    whitelist.push(newEntry);
    await this.saveWhitelist(walletId, whitelist);
  }

  /**
   * Remove address from whitelist
   */
  async removeAddress(walletId: string, entryId: string): Promise<void> {
    const whitelist = await this.getWhitelist(walletId);
    const filtered = whitelist.filter(entry => entry.id !== entryId);
    await this.saveWhitelist(walletId, filtered);
  }

  /**
   * Update whitelist entry
   */
  async updateAddress(
    walletId: string,
    entryId: string,
    updates: Partial<WhitelistEntry>,
  ): Promise<void> {
    const whitelist = await this.getWhitelist(walletId);
    const index = whitelist.findIndex(entry => entry.id === entryId);
    
    if (index === -1) {
      throw new Error('Address not found in whitelist');
    }

    whitelist[index] = { ...whitelist[index], ...updates };
    await this.saveWhitelist(walletId, whitelist);
  }

  /**
   * Check if address is whitelisted
   */
  async isWhitelisted(
    walletId: string,
    address: string,
    chainId?: number,
  ): Promise<boolean> {
    const whitelist = await this.getWhitelist(walletId);
    return whitelist.some(entry => 
      entry.address.toLowerCase() === address.toLowerCase() &&
      (!entry.chainId || entry.chainId === chainId)
    );
  }

  /**
   * Get whitelist entry
   */
  async getEntry(
    walletId: string,
    address: string,
    chainId?: number,
  ): Promise<WhitelistEntry | null> {
    const whitelist = await this.getWhitelist(walletId);
    return whitelist.find(entry => 
      entry.address.toLowerCase() === address.toLowerCase() &&
      (!entry.chainId || entry.chainId === chainId)
    ) || null;
  }

  private async saveWhitelist(walletId: string, whitelist: WhitelistEntry[]): Promise<void> {
    try {
      const key = `${STORAGE_KEY_PREFIX}${walletId}`;
      await AsyncStorage.setItem(key, JSON.stringify(whitelist));
    } catch (error) {
      console.error('Error saving whitelist:', error);
      throw error;
    }
  }

  /**
   * Clear all whitelist data
   */
  async clearAll(): Promise<void> {
    const keys = await AsyncStorage.getAllKeys();
    const whitelistKeys = keys.filter(key => key.startsWith(STORAGE_KEY_PREFIX));
    await AsyncStorage.multiRemove(whitelistKeys);
  }
}

export default WhitelistService.getInstance();
