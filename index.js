// Copyright (C) 2026 MalinWallet Infrastructure - All Rights Reserved
import 'react-native-gesture-handler';
import 'react-native-get-random-values';
import 'react-native-url-polyfill/auto';
import 'text-encoding';
import './shim.js';

import React, { useEffect } from 'react';
import { AppRegistry, LogBox } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import App from './App';
import { restoreSavedPreferredFiatCurrencyAndExchangeFromStorage } from './malin_modules/currency';

if (!Error.captureStackTrace) {
  // captureStackTrace is only available when debugging
  Error.captureStackTrace = () => {};
}

// Global error handler to catch unhandled errors
const originalHandler = ErrorUtils.getGlobalHandler();
ErrorUtils.setGlobalHandler(async (error, isFatal) => {
  // Check if it's the arrayify error from ethers
  if (error && error.message && error.message.includes('invalid arrayify value')) {
    console.error('Caught arrayify error, attempting to clear corrupted storage:', error.message);
    
    try {
      // Clear WalletConnect storage which is likely corrupted
      const keys = await AsyncStorage.getAllKeys();
      const wcKeys = keys.filter(key => 
        key.startsWith('wc@') || 
        key.includes('walletconnect') || 
        key.includes('@walletconnect')
      );
      
      if (wcKeys.length > 0) {
        console.log('Clearing corrupted WalletConnect keys:', wcKeys);
        await AsyncStorage.multiRemove(wcKeys);
        console.log('Storage cleared. Please restart the app.');
      }
    } catch (clearError) {
      console.error('Failed to clear storage:', clearError);
    }
  }
  
  // Call original handler
  if (originalHandler) {
    originalHandler(error, isFatal);
  } else {
    console.error('Unhandled error:', error);
  }
});

LogBox.ignoreLogs([
  'Require cycle:',
  'Battery state `unknown` and monitoring disabled, this is normal for simulators and tvOS.',
  'Open debugger to view warnings.',
  'Non-serializable values were found in the navigation state',
  'invalid arrayify value', // Ignore this in LogBox since we handle it globally
]);

const MalinAppComponent = () => {
  useEffect(() => {
    restoreSavedPreferredFiatCurrencyAndExchangeFromStorage();
  }, []);

  return <App />;
};

AppRegistry.registerComponent('MalinWallet', () => MalinAppComponent);
