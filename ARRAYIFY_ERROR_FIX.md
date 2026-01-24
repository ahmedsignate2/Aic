# Fix for "invalid arrayify value" Crash

## Problem
The app was crashing on Android with this error:
```
com.facebook.react.common.JavascriptException: Error: invalid arrayify value 
(argument="value", value="[very long hex string]", code=INVALID_ARGUMENT, version=bytes/5.8.0)
```

This error occurs when the WalletConnect library (which uses ethers.js) tries to decode corrupted data stored in AsyncStorage.

## Root Cause
- WalletConnect stores session data in AsyncStorage
- If the data becomes corrupted (e.g., partial write, unexpected shutdown), the ethers `arrayify` function receives malformed hex data
- The error happens during app initialization in the native module thread, before React error boundaries can catch it
- This causes the entire app to crash on startup

## Solution

### 1. Defensive Error Handling (Prevention)
Added multiple layers of error handling:

**a) Global Error Handler** (`index.js`)
- Catches unhandled errors before they crash the app
- Automatically clears corrupted WalletConnect storage when arrayify errors are detected
- Allows app to restart cleanly

**b) WalletConnect Initialization** (`class/services/walletconnect-service.ts`)
- Clears potentially corrupted WalletConnect keys before initialization
- Catches initialization errors without crashing the app
- App continues without WalletConnect if initialization fails

**c) StorageProvider** (`components/Context/StorageProvider.tsx`)
- Delays WalletConnect initialization to allow critical components to load first
- Wraps initialization in try-catch to prevent propagation of errors

### 2. Recovery Tool (Repair)
Created `scripts/clear-walletconnect-storage.js` to manually clear corrupted storage:

```bash
npm run clear:wc
```

This script:
- Stops the app
- Removes all WalletConnect-related storage files
- Provides instructions for restart

### 3. Manual Recovery (Last Resort)
If the script doesn't work, manually clear storage via adb:

```bash
adb shell
run-as com.malinwallet.app
cd /data/data/com.malinwallet.app/files/RCTAsyncLocalStorage_V1
rm -f *wc* *walletconnect* *@walletconnect*
exit
```

Then restart the app:
```bash
npm run android:restart
```

## Testing
1. Install the updated app
2. If it crashes on first run, the global error handler will clear the corrupted storage
3. Restart the app - it should now work
4. WalletConnect functionality will need to be re-paired with dApps

## Prevention
The fix includes automatic recovery, but to minimize the chance of corruption:
- Ensure proper app shutdown (don't force-kill during critical operations)
- Keep sufficient device storage space
- Update to latest WalletConnect library versions when available

## Files Modified
1. `index.js` - Added global error handler
2. `class/services/walletconnect-service.ts` - Added storage clearing and error handling
3. `components/Context/StorageProvider.tsx` - Delayed WalletConnect initialization
4. `scripts/clear-walletconnect-storage.js` - New recovery tool
5. `package.json` - Added `clear:wc` script

## Related Issues
- Error occurs in `bytes@5.8.0` (part of ethers v6.16.0)
- Stack trace shows: `arrayify` → `decode` → `getData`
- Happens in `mqt_native_modules` thread (React Native bridge)
