#!/usr/bin/env node
/**
 * Clear WalletConnect storage to fix arrayify errors
 * Run this script with: node scripts/clear-walletconnect-storage.js
 * 
 * Or directly via adb:
 * adb shell run-as com.malinwallet.app rm -rf /data/data/com.malinwallet.app/files/RCTAsyncLocalStorage_V1/*wc*
 */

const { execSync } = require('child_process');

console.log('🔧 Clearing WalletConnect storage from Android device...\n');

try {
  // Check if device is connected
  console.log('Checking for connected devices...');
  const devices = execSync('adb devices').toString();
  
  if (!devices.includes('device')) {
    console.error('❌ No Android device connected. Please connect your device and try again.');
    process.exit(1);
  }
  
  console.log('✅ Device found\n');
  
  // Stop the app first
  console.log('Stopping app...');
  execSync('adb shell am force-stop com.malinwallet.app');
  console.log('✅ App stopped\n');
  
  // Clear WalletConnect storage
  console.log('Clearing WalletConnect storage...');
  
  // Method 1: Clear via AsyncStorage keys
  const clearCommands = [
    'adb shell "run-as com.malinwallet.app find /data/data/com.malinwallet.app/files/RCTAsyncLocalStorage_V1 -name \'*wc*\' -delete"',
    'adb shell "run-as com.malinwallet.app find /data/data/com.malinwallet.app/files/RCTAsyncLocalStorage_V1 -name \'*walletconnect*\' -delete"',
    'adb shell "run-as com.malinwallet.app find /data/data/com.malinwallet.app/files/RCTAsyncLocalStorage_V1 -name \'*@walletconnect*\' -delete"',
  ];
  
  clearCommands.forEach(cmd => {
    try {
      execSync(cmd, { stdio: 'ignore' });
    } catch (e) {
      // Ignore errors - files might not exist
    }
  });
  
  console.log('✅ WalletConnect storage cleared\n');
  
  console.log('🎉 Done! You can now restart the app.');
  console.log('\nTo restart the app, run:');
  console.log('  npm run android:restart');
  
} catch (error) {
  console.error('❌ Error:', error.message);
  console.error('\nTry manually clearing the storage with:');
  console.error('  adb shell');
  console.error('  run-as com.malinwallet.app');
  console.error('  cd /data/data/com.malinwallet.app/files/RCTAsyncLocalStorage_V1');
  console.error('  rm -f *wc* *walletconnect*');
  process.exit(1);
}
