/**
 * Social Recovery Service
 * Shamir Secret Sharing for wallet recovery via guardians
 * 
 * SETUP REQUIRED:
 * npm install secrets.js-grempe
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
// import { randomBytes } from 'react-native-randombytes';

const GUARDIANS_KEY = '@malinwallet:social:guardians';
const RECOVERY_KEY = '@malinwallet:social:recovery';

export interface Guardian {
  id: string;
  name: string;
  contact: string; // email or phone
  shard: string; // encrypted shard
  addedAt: number;
  verified: boolean;
}

export interface RecoveryConfig {
  threshold: number; // M in M-of-N
  totalShares: number; // N in M-of-N
  guardians: Guardian[];
  createdAt: number;
}

export interface RecoveryRequest {
  id: string;
  initiatedAt: number;
  expiresAt: number; // 24h from initiation
  approvedShards: string[];
  requiredShards: number;
  status: 'pending' | 'approved' | 'rejected' | 'expired';
}

export class SocialRecoveryService {
  private static instance: SocialRecoveryService;

  private constructor() {}

  static getInstance(): SocialRecoveryService {
    if (!SocialRecoveryService.instance) {
      SocialRecoveryService.instance = new SocialRecoveryService();
    }
    return SocialRecoveryService.instance;
  }

  /**
   * Split secret into shards using Shamir's Secret Sharing
   */
  async splitSecret(
    secret: string,
    threshold: number,
    totalShares: number,
  ): Promise<string[]> {
    try {
      // Using secrets.js-grempe
      // const secrets = require('secrets.js-grempe');
      // const shares = secrets.share(secret, totalShares, threshold);
      // return shares;

      // Mock implementation
      const shares: string[] = [];
      for (let i = 0; i < totalShares; i++) {
        shares.push(`SHARD_${i}_${secret.slice(0, 10)}...`);
      }
      return shares;
    } catch (error) {
      console.error('Failed to split secret:', error);
      throw error;
    }
  }

  /**
   * Reconstruct secret from shards
   */
  async reconstructSecret(shards: string[]): Promise<string> {
    try {
      // Using secrets.js-grempe
      // const secrets = require('secrets.js-grempe');
      // const secret = secrets.combine(shards);
      // return secret;

      // Mock implementation
      return 'RECONSTRUCTED_SECRET_12345';
    } catch (error) {
      console.error('Failed to reconstruct secret:', error);
      throw error;
    }
  }

  /**
   * Setup social recovery for a wallet
   */
  async setupRecovery(
    walletId: string,
    secret: string,
    guardians: { name: string; contact: string }[],
    threshold: number,
  ): Promise<RecoveryConfig> {
    const totalShares = guardians.length;
    
    if (threshold > totalShares) {
      throw new Error('Threshold cannot exceed total shares');
    }

    if (threshold < 2) {
      throw new Error('Threshold must be at least 2');
    }

    // Split secret
    const shards = await this.splitSecret(secret, threshold, totalShares);

    // Create guardian objects
    const guardianList: Guardian[] = guardians.map((g, index) => ({
      id: `${Date.now()}-${index}`,
      name: g.name,
      contact: g.contact,
      shard: shards[index],
      addedAt: Date.now(),
      verified: false,
    }));

    const config: RecoveryConfig = {
      threshold,
      totalShares,
      guardians: guardianList,
      createdAt: Date.now(),
    };

    // Save config
    await AsyncStorage.setItem(
      `${GUARDIANS_KEY}:${walletId}`,
      JSON.stringify(config),
    );

    return config;
  }

  /**
   * Get recovery config for wallet
   */
  async getRecoveryConfig(walletId: string): Promise<RecoveryConfig | null> {
    try {
      const data = await AsyncStorage.getItem(`${GUARDIANS_KEY}:${walletId}`);
      if (data) {
        return JSON.parse(data);
      }
    } catch (error) {
      console.error('Failed to load recovery config:', error);
    }
    return null;
  }

  /**
   * Add guardian
   */
  async addGuardian(
    walletId: string,
    name: string,
    contact: string,
    shard: string,
  ): Promise<void> {
    const config = await this.getRecoveryConfig(walletId);
    if (!config) {
      throw new Error('No recovery config found');
    }

    const guardian: Guardian = {
      id: `${Date.now()}-${Math.random()}`,
      name,
      contact,
      shard,
      addedAt: Date.now(),
      verified: false,
    };

    config.guardians.push(guardian);
    config.totalShares = config.guardians.length;

    await AsyncStorage.setItem(
      `${GUARDIANS_KEY}:${walletId}`,
      JSON.stringify(config),
    );
  }

  /**
   * Remove guardian
   */
  async removeGuardian(walletId: string, guardianId: string): Promise<void> {
    const config = await this.getRecoveryConfig(walletId);
    if (!config) {
      throw new Error('No recovery config found');
    }

    config.guardians = config.guardians.filter(g => g.id !== guardianId);
    config.totalShares = config.guardians.length;

    await AsyncStorage.setItem(
      `${GUARDIANS_KEY}:${walletId}`,
      JSON.stringify(config),
    );
  }

  /**
   * Initiate recovery request
   */
  async initiateRecovery(walletId: string): Promise<RecoveryRequest> {
    const config = await this.getRecoveryConfig(walletId);
    if (!config) {
      throw new Error('No recovery config found');
    }

    const request: RecoveryRequest = {
      id: `recovery-${Date.now()}`,
      initiatedAt: Date.now(),
      expiresAt: Date.now() + 24 * 60 * 60 * 1000, // 24h
      approvedShards: [],
      requiredShards: config.threshold,
      status: 'pending',
    };

    await AsyncStorage.setItem(
      `${RECOVERY_KEY}:${walletId}`,
      JSON.stringify(request),
    );

    // TODO: Notify guardians via email/SMS

    return request;
  }

  /**
   * Submit shard for recovery
   */
  async submitShard(walletId: string, shard: string): Promise<RecoveryRequest> {
    const data = await AsyncStorage.getItem(`${RECOVERY_KEY}:${walletId}`);
    if (!data) {
      throw new Error('No recovery request found');
    }

    const request: RecoveryRequest = JSON.parse(data);

    if (request.status !== 'pending') {
      throw new Error('Recovery request is not pending');
    }

    if (Date.now() > request.expiresAt) {
      request.status = 'expired';
      await AsyncStorage.setItem(
        `${RECOVERY_KEY}:${walletId}`,
        JSON.stringify(request),
      );
      throw new Error('Recovery request expired');
    }

    // Add shard
    request.approvedShards.push(shard);

    // Check if we have enough shards
    if (request.approvedShards.length >= request.requiredShards) {
      request.status = 'approved';
    }

    await AsyncStorage.setItem(
      `${RECOVERY_KEY}:${walletId}`,
      JSON.stringify(request),
    );

    return request;
  }

  /**
   * Complete recovery and reconstruct wallet
   */
  async completeRecovery(walletId: string): Promise<string> {
    const data = await AsyncStorage.getItem(`${RECOVERY_KEY}:${walletId}`);
    if (!data) {
      throw new Error('No recovery request found');
    }

    const request: RecoveryRequest = JSON.parse(data);

    if (request.status !== 'approved') {
      throw new Error('Recovery not approved yet');
    }

    // Reconstruct secret
    const secret = await this.reconstructSecret(request.approvedShards);

    // Clean up recovery request
    await AsyncStorage.removeItem(`${RECOVERY_KEY}:${walletId}`);

    return secret;
  }

  /**
   * Get recovery status
   */
  async getRecoveryStatus(walletId: string): Promise<RecoveryRequest | null> {
    try {
      const data = await AsyncStorage.getItem(`${RECOVERY_KEY}:${walletId}`);
      if (data) {
        return JSON.parse(data);
      }
    } catch (error) {
      console.error('Failed to load recovery status:', error);
    }
    return null;
  }

  /**
   * Generate shareable link/QR for guardian
   */
  generateGuardianLink(guardianId: string, shard: string): string {
    const payload = {
      guardianId,
      shard,
      timestamp: Date.now(),
    };
    
    const encoded = Buffer.from(JSON.stringify(payload)).toString('base64');
    return `malinwallet://recovery/guardian/${encoded}`;
  }

  /**
   * Parse guardian link
   */
  parseGuardianLink(link: string): { guardianId: string; shard: string } | null {
    try {
      const match = link.match(/malinwallet:\/\/recovery\/guardian\/(.+)/);
      if (!match) return null;

      const decoded = Buffer.from(match[1], 'base64').toString();
      const payload = JSON.parse(decoded);

      return {
        guardianId: payload.guardianId,
        shard: payload.shard,
      };
    } catch (error) {
      console.error('Failed to parse guardian link:', error);
      return null;
    }
  }
}

export default SocialRecoveryService.getInstance();
