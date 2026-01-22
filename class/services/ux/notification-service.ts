/**
 * Notification Service
 * Push notifications for transactions, alerts, etc.
 * 
 * SETUP REQUIRED:
 * npm install @react-native-firebase/messaging @react-native-firebase/app
 * OR
 * npm install react-native-push-notification
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const SETTINGS_KEY = '@malinwallet:notifications:settings';

export enum NotificationType {
  TRANSACTION_RECEIVED = 'transaction_received',
  TRANSACTION_CONFIRMED = 'transaction_confirmed',
  TRANSACTION_FAILED = 'transaction_failed',
  PRICE_ALERT = 'price_alert',
  SECURITY_ALERT = 'security_alert',
  APPROVAL_GRANTED = 'approval_granted',
}

export interface NotificationSettings {
  enabled: boolean;
  transactionReceived: boolean;
  transactionConfirmed: boolean;
  transactionFailed: boolean;
  priceAlerts: boolean;
  securityAlerts: boolean;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
}

export interface NotificationPayload {
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, any>;
}

export class NotificationService {
  private static instance: NotificationService;
  private initialized = false;

  private constructor() {}

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  /**
   * Initialize notification service
   * MUST be called before using notifications
   */
  async initialize(): Promise<boolean> {
    if (this.initialized) return true;

    try {
      // Request permissions
      const hasPermission = await this.requestPermission();
      if (!hasPermission) {
        console.log('Notification permission denied');
        return false;
      }

      // Setup listeners (if using Firebase or similar)
      this.setupListeners();

      this.initialized = true;
      return true;
    } catch (error) {
      console.error('Failed to initialize notifications:', error);
      return false;
    }
  }

  /**
   * Request notification permission
   */
  private async requestPermission(): Promise<boolean> {
    try {
      // For Firebase Messaging (if installed)
      // const messaging = require('@react-native-firebase/messaging').default;
      // const authStatus = await messaging().requestPermission();
      // return authStatus === messaging.AuthorizationStatus.AUTHORIZED;

      // For react-native-push-notification
      // const PushNotification = require('react-native-push-notification');
      // PushNotification.requestPermissions();
      
      // Mock permission for now
      console.log('Notification permission requested (mock)');
      return true;
    } catch (error) {
      console.error('Permission request failed:', error);
      return false;
    }
  }

  /**
   * Setup notification listeners
   */
  private setupListeners() {
    // Setup foreground listener
    // messaging().onMessage(async remoteMessage => {
    //   this.handleNotification(remoteMessage);
    // });

    // Setup background listener
    // messaging().setBackgroundMessageHandler(async remoteMessage => {
    //   this.handleNotification(remoteMessage);
    // });
  }

  /**
   * Send local notification
   */
  async sendNotification(payload: NotificationPayload): Promise<void> {
    const settings = await this.getSettings();
    
    if (!settings.enabled) {
      console.log('Notifications disabled');
      return;
    }

    // Check if this type is enabled
    if (!this.isTypeEnabled(payload.type, settings)) {
      return;
    }

    try {
      // For react-native-push-notification
      // const PushNotification = require('react-native-push-notification');
      // PushNotification.localNotification({
      //   title: payload.title,
      //   message: payload.body,
      //   playSound: settings.soundEnabled,
      //   vibrate: settings.vibrationEnabled,
      //   userInfo: payload.data,
      // });

      console.log('Notification sent:', payload.title);
    } catch (error) {
      console.error('Failed to send notification:', error);
    }
  }

  /**
   * Check if notification type is enabled
   */
  private isTypeEnabled(type: NotificationType, settings: NotificationSettings): boolean {
    switch (type) {
      case NotificationType.TRANSACTION_RECEIVED:
        return settings.transactionReceived;
      case NotificationType.TRANSACTION_CONFIRMED:
        return settings.transactionConfirmed;
      case NotificationType.TRANSACTION_FAILED:
        return settings.transactionFailed;
      case NotificationType.PRICE_ALERT:
        return settings.priceAlerts;
      case NotificationType.SECURITY_ALERT:
        return settings.securityAlerts;
      default:
        return true;
    }
  }

  /**
   * Get notification settings
   */
  async getSettings(): Promise<NotificationSettings> {
    try {
      const data = await AsyncStorage.getItem(SETTINGS_KEY);
      if (data) {
        return JSON.parse(data);
      }
    } catch (error) {
      console.error('Failed to load notification settings:', error);
    }

    // Default settings
    return {
      enabled: true,
      transactionReceived: true,
      transactionConfirmed: true,
      transactionFailed: true,
      priceAlerts: true,
      securityAlerts: true,
      soundEnabled: true,
      vibrationEnabled: true,
    };
  }

  /**
   * Update notification settings
   */
  async updateSettings(settings: Partial<NotificationSettings>): Promise<void> {
    const current = await this.getSettings();
    const updated = { ...current, ...settings };
    
    try {
      await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(updated));
    } catch (error) {
      console.error('Failed to save notification settings:', error);
    }
  }

  /**
   * Helper: Notify transaction received
   */
  async notifyTransactionReceived(amount: string, currency: string, txHash: string): Promise<void> {
    await this.sendNotification({
      type: NotificationType.TRANSACTION_RECEIVED,
      title: '💰 Transaction Received',
      body: `You received ${amount} ${currency}`,
      data: { txHash },
    });
  }

  /**
   * Helper: Notify transaction confirmed
   */
  async notifyTransactionConfirmed(txHash: string): Promise<void> {
    await this.sendNotification({
      type: NotificationType.TRANSACTION_CONFIRMED,
      title: '✅ Transaction Confirmed',
      body: 'Your transaction has been confirmed',
      data: { txHash },
    });
  }

  /**
   * Helper: Notify transaction failed
   */
  async notifyTransactionFailed(reason: string): Promise<void> {
    await this.sendNotification({
      type: NotificationType.TRANSACTION_FAILED,
      title: '❌ Transaction Failed',
      body: reason,
      data: {},
    });
  }

  /**
   * Helper: Notify price alert
   */
  async notifyPriceAlert(asset: string, change: number): Promise<void> {
    const emoji = change > 0 ? '📈' : '📉';
    await this.sendNotification({
      type: NotificationType.PRICE_ALERT,
      title: `${emoji} Price Alert`,
      body: `${asset} ${change > 0 ? 'up' : 'down'} ${Math.abs(change).toFixed(1)}%`,
      data: { asset, change },
    });
  }

  /**
   * Helper: Notify security alert
   */
  async notifySecurityAlert(message: string): Promise<void> {
    await this.sendNotification({
      type: NotificationType.SECURITY_ALERT,
      title: '🚨 Security Alert',
      body: message,
      data: {},
    });
  }
}

export default NotificationService.getInstance();
