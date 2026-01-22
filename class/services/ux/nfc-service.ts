/**
 * NFC Service
 * Tap-to-pay and address exchange via NFC
 * 
 * SETUP REQUIRED:
 * npm install react-native-nfc-manager
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const SETTINGS_KEY = '@malinwallet:nfc:settings';

export interface NFCSettings {
  enabled: boolean;
  autoRead: boolean;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
}

export interface NFCPaymentData {
  address: string;
  amount?: string;
  token?: string;
  chainId?: number;
  message?: string;
}

export class NFCService {
  private static instance: NFCService;
  private initialized = false;
  private isReading = false;

  private constructor() {}

  static getInstance(): NFCService {
    if (!NFCService.instance) {
      NFCService.instance = new NFCService();
    }
    return NFCService.instance;
  }

  /**
   * Initialize NFC
   */
  async initialize(): Promise<boolean> {
    if (this.initialized) return true;

    try {
      // Using react-native-nfc-manager
      // const NfcManager = require('react-native-nfc-manager').default;
      // await NfcManager.start();
      // this.initialized = true;
      // return true;

      console.log('NFC initialized (mock)');
      this.initialized = true;
      return true;
    } catch (error) {
      console.error('NFC initialization failed:', error);
      return false;
    }
  }

  /**
   * Check if NFC is supported
   */
  async isSupported(): Promise<boolean> {
    try {
      // const NfcManager = require('react-native-nfc-manager').default;
      // return await NfcManager.isSupported();
      
      // Mock
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Check if NFC is enabled
   */
  async isEnabled(): Promise<boolean> {
    try {
      // const NfcManager = require('react-native-nfc-manager').default;
      // return await NfcManager.isEnabled();
      
      // Mock
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Read NFC tag
   */
  async readTag(): Promise<NFCPaymentData | null> {
    if (!this.initialized) {
      await this.initialize();
    }

    if (this.isReading) {
      return null;
    }

    try {
      this.isReading = true;

      // Using react-native-nfc-manager
      // const NfcManager = require('react-native-nfc-manager').default;
      // const NfcTech = require('react-native-nfc-manager').NfcTech;
      
      // await NfcManager.requestTechnology(NfcTech.Ndef);
      // const tag = await NfcManager.getTag();
      
      // if (tag && tag.ndefMessage && tag.ndefMessage.length > 0) {
      //   const record = tag.ndefMessage[0];
      //   const payloadString = this.parseNdefPayload(record.payload);
      //   return JSON.parse(payloadString);
      // }

      // Mock data
      return {
        address: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
        amount: '0.5',
        token: 'ETH',
        chainId: 1,
      };
    } catch (error) {
      console.error('NFC read failed:', error);
      return null;
    } finally {
      this.isReading = false;
      // await NfcManager.cancelTechnologyRequest();
    }
  }

  /**
   * Write payment data to NFC tag
   */
  async writePaymentData(data: NFCPaymentData): Promise<boolean> {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      // Using react-native-nfc-manager
      // const NfcManager = require('react-native-nfc-manager').default;
      // const NfcTech = require('react-native-nfc-manager').NfcTech;
      // const Ndef = require('react-native-nfc-manager').Ndef;
      
      // await NfcManager.requestTechnology(NfcTech.Ndef);
      
      // const payload = JSON.stringify(data);
      // const bytes = Ndef.encodeMessage([Ndef.textRecord(payload)]);
      
      // await NfcManager.ndefHandler.writeNdefMessage(bytes);
      // await NfcManager.cancelTechnologyRequest();

      console.log('NFC write successful (mock):', data);
      return true;
    } catch (error) {
      console.error('NFC write failed:', error);
      return false;
    }
  }

  /**
   * Start listening for NFC tags
   */
  async startListening(onTagDetected: (data: NFCPaymentData) => void): Promise<void> {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      // Using react-native-nfc-manager
      // const NfcManager = require('react-native-nfc-manager').default;
      // const NfcEvents = require('react-native-nfc-manager').NfcEvents;
      
      // NfcManager.setEventListener(NfcEvents.DiscoverTag, async (tag) => {
      //   if (tag.ndefMessage && tag.ndefMessage.length > 0) {
      //     const record = tag.ndefMessage[0];
      //     const payloadString = this.parseNdefPayload(record.payload);
      //     const data = JSON.parse(payloadString);
      //     onTagDetected(data);
      //   }
      // });

      console.log('NFC listening started (mock)');
    } catch (error) {
      console.error('NFC listening failed:', error);
    }
  }

  /**
   * Stop listening for NFC tags
   */
  async stopListening(): Promise<void> {
    try {
      // const NfcManager = require('react-native-nfc-manager').default;
      // NfcManager.setEventListener(NfcEvents.DiscoverTag, null);

      console.log('NFC listening stopped (mock)');
    } catch (error) {
      console.error('Failed to stop NFC listening:', error);
    }
  }

  /**
   * Parse NDEF payload
   */
  private parseNdefPayload(payload: number[]): string {
    // Skip language code byte (first byte)
    return String.fromCharCode(...payload.slice(1));
  }

  /**
   * Generate payment URI for NFC
   */
  generatePaymentURI(data: NFCPaymentData): string {
    const params = new URLSearchParams();
    if (data.amount) params.append('amount', data.amount);
    if (data.token) params.append('token', data.token);
    if (data.chainId) params.append('chainId', data.chainId.toString());
    if (data.message) params.append('message', data.message);

    return `malinwallet://pay/${data.address}?${params.toString()}`;
  }

  /**
   * Parse payment URI
   */
  parsePaymentURI(uri: string): NFCPaymentData | null {
    try {
      const match = uri.match(/malinwallet:\/\/pay\/([^?]+)(\?(.+))?/);
      if (!match) return null;

      const address = match[1];
      const params = new URLSearchParams(match[3] || '');

      return {
        address,
        amount: params.get('amount') || undefined,
        token: params.get('token') || undefined,
        chainId: params.get('chainId') ? parseInt(params.get('chainId')!) : undefined,
        message: params.get('message') || undefined,
      };
    } catch (error) {
      console.error('Failed to parse payment URI:', error);
      return null;
    }
  }

  /**
   * Get NFC settings
   */
  async getSettings(): Promise<NFCSettings> {
    try {
      const data = await AsyncStorage.getItem(SETTINGS_KEY);
      if (data) {
        return JSON.parse(data);
      }
    } catch (error) {
      console.error('Failed to load NFC settings:', error);
    }

    return {
      enabled: true,
      autoRead: true,
      soundEnabled: true,
      vibrationEnabled: true,
    };
  }

  /**
   * Update NFC settings
   */
  async updateSettings(settings: Partial<NFCSettings>): Promise<void> {
    const current = await this.getSettings();
    const updated = { ...current, ...settings };
    
    try {
      await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(updated));
    } catch (error) {
      console.error('Failed to save NFC settings:', error);
    }
  }
}

export default NFCService.getInstance();
