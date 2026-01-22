// Copyright (C) 2026 MalinWallet Infrastructure - All Rights Reserved
import { Linking } from 'react-native';
import { NavigationContainerRef } from '@react-navigation/native';
import { WalletConnectService } from '../class/services/walletconnect-service';

/**
 * Deep Link Handler for WalletConnect and custom URLs
 * Handles: wc:, malinwallet:, https://malinwallet.app
 */
export class DeepLinkHandler {
  private static navigationRef: NavigationContainerRef<any> | null = null;
  private static initialized = false;

  /**
   * Initialize deep link handling
   */
  static initialize(navigationRef: NavigationContainerRef<any>) {
    if (this.initialized) return;

    this.navigationRef = navigationRef;
    this.initialized = true;

    // Handle initial URL (app opened from deep link)
    Linking.getInitialURL().then((url) => {
      if (url) {
        console.log('Initial deep link:', url);
        this.handleDeepLink(url);
      }
    });

    // Handle URLs when app is already open
    const subscription = Linking.addEventListener('url', (event) => {
      console.log('Deep link received:', event.url);
      this.handleDeepLink(event.url);
    });

    return () => subscription.remove();
  }

  /**
   * Handle incoming deep link
   */
  private static async handleDeepLink(url: string) {
    try {
      console.log('Processing deep link:', url);

      // WalletConnect protocol (wc:...)
      if (url.startsWith('wc:')) {
        await this.handleWalletConnectLink(url);
        return;
      }

      // Custom scheme (malinwallet://...)
      if (url.startsWith('malinwallet://')) {
        await this.handleCustomScheme(url);
        return;
      }

      // Universal links (https://malinwallet.app/...)
      if (url.startsWith('https://malinwallet.app')) {
        await this.handleUniversalLink(url);
        return;
      }

      console.warn('Unhandled deep link:', url);
    } catch (error) {
      console.error('Error handling deep link:', error);
    }
  }

  /**
   * Handle WalletConnect deep link (wc:...)
   */
  private static async handleWalletConnectLink(url: string) {
    try {
      // Initialize WalletConnect service if needed
      const wcService = WalletConnectService.getInstance();
      await wcService.initialize();

      // Pair with the WalletConnect URI
      await wcService.pair(url);

      // Navigate to WCSessionRequest screen
      // The session request will be handled by WalletConnect events
      console.log('WalletConnect pairing initiated');
    } catch (error) {
      console.error('Error handling WalletConnect link:', error);
      
      // Navigate to WCPair screen with error
      if (this.navigationRef?.isReady()) {
        this.navigationRef.navigate('WCPair', { 
          error: 'Failed to connect. Please try scanning the QR code again.' 
        });
      }
    }
  }

  /**
   * Handle custom scheme (malinwallet://...)
   * Examples:
   * - malinwallet://wc?uri=wc:...
   * - malinwallet://send?address=0x...&amount=1.5
   * - malinwallet://token?address=0x...
   */
  private static async handleCustomScheme(url: string) {
    const urlObj = new URL(url);
    const path = urlObj.host; // malinwallet://PATH/...
    const params = Object.fromEntries(urlObj.searchParams);

    console.log('Custom scheme:', { path, params });

    if (!this.navigationRef?.isReady()) {
      console.warn('Navigation not ready');
      return;
    }

    switch (path) {
      case 'wc':
        // malinwallet://wc?uri=wc:...
        if (params.uri) {
          await this.handleWalletConnectLink(params.uri);
        }
        break;

      case 'send':
        // malinwallet://send?address=0x...&amount=1.5&token=0x...
        this.navigationRef.navigate('SendDetailsRoot', {
          screen: 'SendDetails',
          params: {
            address: params.address,
            amount: params.amount,
            // token contract if specified
          },
        });
        break;

      case 'receive':
        // malinwallet://receive?walletID=...
        this.navigationRef.navigate('ReceiveDetails', {
          walletID: params.walletID,
        });
        break;

      case 'token':
        // malinwallet://token?address=0x...&chainId=1
        this.navigationRef.navigate('AddToken', {
          address: params.address,
          chainId: params.chainId ? parseInt(params.chainId) : 1,
        });
        break;

      case 'swap':
        // malinwallet://swap
        this.navigationRef.navigate('Swap');
        break;

      case 'bridge':
        // malinwallet://bridge?fromChainId=1&toChainId=137
        this.navigationRef.navigate('BridgeScreen', {
          fromChainId: params.fromChainId ? parseInt(params.fromChainId) : undefined,
        });
        break;

      default:
        console.warn('Unknown custom scheme path:', path);
    }
  }

  /**
   * Handle universal links (https://malinwallet.app/...)
   * Examples:
   * - https://malinwallet.app/wc?uri=wc:...
   * - https://malinwallet.app/send?address=0x...
   */
  private static async handleUniversalLink(url: string) {
    const urlObj = new URL(url);
    const path = urlObj.pathname.slice(1); // Remove leading /
    const params = Object.fromEntries(urlObj.searchParams);

    console.log('Universal link:', { path, params });

    // Convert to custom scheme and handle
    const customSchemeUrl = `malinwallet://${path}?${urlObj.search.slice(1)}`;
    await this.handleCustomScheme(customSchemeUrl);
  }

  /**
   * Create a deep link URL
   */
  static createDeepLink(path: string, params?: Record<string, string>): string {
    const searchParams = new URLSearchParams(params);
    const query = searchParams.toString();
    return `malinwallet://${path}${query ? `?${query}` : ''}`;
  }

  /**
   * Open external URL
   */
  static async openURL(url: string): Promise<boolean> {
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
        return true;
      }
      console.warn('Cannot open URL:', url);
      return false;
    } catch (error) {
      console.error('Error opening URL:', error);
      return false;
    }
  }

  /**
   * Check if URL can be opened
   */
  static async canOpenURL(url: string): Promise<boolean> {
    try {
      return await Linking.canOpenURL(url);
    } catch {
      return false;
    }
  }
}
