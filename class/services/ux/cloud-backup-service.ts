/**
 * Cloud Backup Service
 * Encrypted backup to Firebase Storage or iCloud
 * 
 * SETUP REQUIRED:
 * npm install @react-native-firebase/storage @react-native-firebase/app
 * OR
 * npm install react-native-icloudstore
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

const BACKUP_SETTINGS_KEY = '@malinwallet:backup:settings';
const LAST_BACKUP_KEY = '@malinwallet:backup:last';
const BACKUP_KEY = '@malinwallet:backup';

export interface BackupSettings {
  enabled: boolean;
  autoBackup: boolean;
  frequency: 'daily' | 'weekly' | 'after_transaction';
  provider: 'firebase' | 'icloud' | 'manual';
  lastBackup: number | null;
}

export interface BackupData {
  version: string;
  timestamp: number;
  wallets: any[]; // Encrypted wallet data
  settings: any;
  whitelist: any;
  spendingLimits: any;
}

export class CloudBackupService {
  private static instance: CloudBackupService;
  private readonly ALGORITHM = 'aes-256-gcm';

  private constructor() {}

  static getInstance(): CloudBackupService {
    if (!CloudBackupService.instance) {
      CloudBackupService.instance = new CloudBackupService();
    }
    return CloudBackupService.instance;
  }

  /**
   * Encrypt data with password
   */
  private encrypt(data: string, password: string): { encrypted: string; iv: string; tag: string } {
    try {
      const key = this.deriveKey(password);
      const iv = randomBytes(16);
      const cipher = createCipheriv(this.ALGORITHM, key, iv);
      
      let encrypted = cipher.update(data, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      const tag = cipher.getAuthTag();

      return {
        encrypted,
        iv: iv.toString('hex'),
        tag: tag.toString('hex'),
      };
    } catch (error) {
      console.error('Encryption failed:', error);
      throw new Error('Failed to encrypt data');
    }
  }

  /**
   * Decrypt data with password
   */
  private decrypt(encrypted: string, iv: string, tag: string, password: string): string {
    try {
      const key = this.deriveKey(password);
      const decipher = createDecipheriv(
        this.ALGORITHM,
        key,
        Buffer.from(iv, 'hex'),
      );
      
      decipher.setAuthTag(Buffer.from(tag, 'hex'));

      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      return decrypted;
    } catch (error) {
      console.error('Decryption failed:', error);
      throw new Error('Failed to decrypt data - wrong password?');
    }
  }

  /**
   * Derive encryption key from password
   */
  private deriveKey(password: string): Buffer {
    // In production, use PBKDF2 or Argon2
    // const key = crypto.pbkdf2Sync(password, 'salt', 100000, 32, 'sha512');
    
    // Simplified for demo
    const hash = require('crypto').createHash('sha256');
    return hash.update(password).digest();
  }

  /**
   * Create backup data object
   */
  private async createBackupData(_walletId?: string): Promise<BackupData> {
    // Collect all data to backup
    const keys = await AsyncStorage.getAllKeys();
    
    const walletKeys = keys.filter(k => k.includes('@malinwallet:wallet'));
    const settingsKeys = keys.filter(k => k.includes('@malinwallet:settings'));
    const whitelistKeys = keys.filter(k => k.includes('@malinwallet:whitelist'));
    const limitKeys = keys.filter(k => k.includes('@malinwallet:spending:limit'));

    const wallets = await AsyncStorage.multiGet(walletKeys);
    const settings = await AsyncStorage.multiGet(settingsKeys);
    const whitelist = await AsyncStorage.multiGet(whitelistKeys);
    const limits = await AsyncStorage.multiGet(limitKeys);

    return {
      version: '1.0.0',
      timestamp: Date.now(),
      wallets: wallets.map(([key, value]) => ({ key, value })),
      settings: settings.map(([key, value]) => ({ key, value })),
      whitelist: whitelist.map(([key, value]) => ({ key, value })),
      spendingLimits: limits.map(([key, value]) => ({ key, value })),
    };
  }

  /**
   * Create encrypted backup
   */
  async createBackup(password: string): Promise<string> {
    const data = await this.createBackupData();
    const json = JSON.stringify(data);
    const { encrypted, iv, tag } = this.encrypt(json, password);

    const backup = JSON.stringify({ encrypted, iv, tag });
    
    // Update last backup time
    await AsyncStorage.setItem(LAST_BACKUP_KEY, Date.now().toString());

    return backup;
  }

  /**
   * Upload backup to cloud (Firebase)
   */
  async uploadToFirebase(backup: string, userId: string): Promise<void> {
    try {
      // Using Firebase Storage
      // const storage = require('@react-native-firebase/storage').default;
      // const reference = storage().ref(`backups/${userId}/wallet_backup_${Date.now()}.enc`);
      // await reference.putString(backup);

      console.log('Backup uploaded to Firebase (mock)');
    } catch (error) {
      console.error('Firebase upload failed:', error);
      throw new Error('Failed to upload backup to Firebase');
    }
  }

  /**
   * Upload backup to iCloud
   */
  async uploadToICloud(backup: string): Promise<void> {
    try {
      // Using react-native-icloudstore
      // const RNICloudStore = require('react-native-icloudstore').default;
      // await RNICloudStore.setItem(`wallet_backup_${Date.now()}`, backup);

      console.log('Backup uploaded to iCloud (mock)');
    } catch (error) {
      console.error('iCloud upload failed:', error);
      throw new Error('Failed to upload backup to iCloud');
    }
  }

  /**
   * Download backup from Firebase
   */
  async downloadFromFirebase(userId: string): Promise<string> {
    try {
      // Using Firebase Storage
      // const storage = require('@react-native-firebase/storage').default;
      // const list = await storage().ref(`backups/${userId}`).listAll();
      // const latestFile = list.items[list.items.length - 1];
      // const url = await latestFile.getDownloadURL();
      // const response = await fetch(url);
      // return await response.text();

      return 'MOCK_BACKUP_DATA';
    } catch (error) {
      console.error('Firebase download failed:', error);
      throw new Error('Failed to download backup from Firebase');
    }
  }

  /**
   * Download backup from iCloud
   */
  async downloadFromICloud(): Promise<string> {
    try {
      // Using react-native-icloudstore
      // const RNICloudStore = require('react-native-icloudstore').default;
      // const keys = await RNICloudStore.getAllKeys();
      // const latestKey = keys[keys.length - 1];
      // return await RNICloudStore.getItem(latestKey);

      return 'MOCK_BACKUP_DATA';
    } catch (error) {
      console.error('iCloud download failed:', error);
      throw new Error('Failed to download backup from iCloud');
    }
  }

  /**
   * Restore from backup
   */
  async restoreFromBackup(encryptedBackup: string, password: string): Promise<void> {
    try {
      const { encrypted, iv, tag } = JSON.parse(encryptedBackup);
      const decrypted = this.decrypt(encrypted, iv, tag, password);
      const data: BackupData = JSON.parse(decrypted);

      // Restore wallets
      for (const item of data.wallets) {
        await AsyncStorage.setItem(item.key, item.value);
      }

      // Restore settings
      for (const item of data.settings) {
        await AsyncStorage.setItem(item.key, item.value);
      }

      // Restore whitelist
      for (const item of data.whitelist) {
        await AsyncStorage.setItem(item.key, item.value);
      }

      // Restore spending limits
      for (const item of data.spendingLimits) {
        await AsyncStorage.setItem(item.key, item.value);
      }

      console.log('Restore completed successfully');
    } catch (error) {
      console.error('Restore failed:', error);
      throw new Error('Failed to restore from backup');
    }
  }

  /**
   * Backup to cloud (convenience method)
   */
  async backupToCloud(
    walletId: string,
    password: string,
  ): Promise<{ success: boolean; size: number }> {
    try {
      const backupData = await this.createBackupData(walletId);
      const encrypted = this.encrypt(JSON.stringify(backupData), password);
      
      // Save locally
      await AsyncStorage.setItem(
        `${BACKUP_KEY}:${walletId}:${Date.now()}`,
        JSON.stringify(encrypted),
      );

      // Upload to cloud (mock)
      await this.uploadToFirebase(JSON.stringify(encrypted), walletId);

      return {
        success: true,
        size: JSON.stringify(encrypted).length,
      };
    } catch (error) {
      console.error('Backup to cloud failed:', error);
      throw error;
    }
  }

  /**
   * Restore from cloud (convenience method)
   */
  async restoreFromCloud(walletId: string, password: string): Promise<void> {
    try {
      // Download from cloud
      const encryptedBackup = await this.downloadFromFirebase(walletId);
      
      // Restore
      await this.restoreFromBackup(encryptedBackup, password);
    } catch (error) {
      console.error('Restore from cloud failed:', error);
      throw error;
    }
  }

  /**
   * Get backup settings
   */
  async getSettings(): Promise<BackupSettings> {
    try {
      const data = await AsyncStorage.getItem(BACKUP_SETTINGS_KEY);
      if (data) {
        return JSON.parse(data);
      }
    } catch (error) {
      console.error('Failed to load backup settings:', error);
    }

    return {
      enabled: false,
      autoBackup: false,
      frequency: 'weekly',
      provider: 'manual',
      lastBackup: null,
    };
  }

  /**
   * Update backup settings
   */
  async updateSettings(settings: Partial<BackupSettings>): Promise<void> {
    const current = await this.getSettings();
    const updated = { ...current, ...settings };
    
    try {
      await AsyncStorage.setItem(BACKUP_SETTINGS_KEY, JSON.stringify(updated));
    } catch (error) {
      console.error('Failed to save backup settings:', error);
    }
  }

  /**
   * Get last backup timestamp
   */
  async getLastBackupTime(): Promise<number | null> {
    try {
      const data = await AsyncStorage.getItem(LAST_BACKUP_KEY);
      if (data) {
        return parseInt(data, 10);
      }
    } catch (error) {
      console.error('Failed to get last backup time:', error);
    }
    return null;
  }

  /**
   * Check if backup is needed
   */
  async shouldBackup(): Promise<boolean> {
    const settings = await this.getSettings();
    
    if (!settings.enabled || !settings.autoBackup) {
      return false;
    }

    const lastBackup = await this.getLastBackupTime();
    if (!lastBackup) return true;

    const now = Date.now();
    const hoursSince = (now - lastBackup) / (1000 * 60 * 60);

    switch (settings.frequency) {
      case 'daily':
        return hoursSince >= 24;
      case 'weekly':
        return hoursSince >= 24 * 7;
      default:
        return false;
    }
  }
}

export default CloudBackupService.getInstance();
