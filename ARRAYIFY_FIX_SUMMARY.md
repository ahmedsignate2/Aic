# Arrayify Crash Fix - Summary

## ✅ Changes Made

I've fixed the "invalid arrayify value" crash that was causing your Malin Wallet app to crash on Android startup.

### What Was Happening
The app was crashing because:
1. WalletConnect stores session data in the device's AsyncStorage
2. This data became corrupted (possibly from an incomplete write or unexpected shutdown)
3. When the app tried to load on startup, the ethers.js library attempted to decode this corrupted hex data
4. The `arrayify` function in ethers threw an error with an extremely long malformed hex string
5. This happened in a native thread before React could catch it, causing the entire app to crash

### Fixes Applied

#### 1. Global Error Handler (`index.js`)
- Added a global error handler that catches the arrayify error before it crashes the app
- Automatically detects and clears corrupted WalletConnect storage
- Logs the issue and allows the app to restart cleanly

#### 2. WalletConnect Service (`class/services/walletconnect-service.ts`)
- Now clears any potentially corrupted WalletConnect keys before initialization
- Catches initialization errors gracefully without crashing
- App continues to function even if WalletConnect fails to initialize

#### 3. Storage Provider (`components/Context/StorageProvider.tsx`)
- Delayed WalletConnect initialization by 1 second to let critical components load first
- Wrapped initialization in proper error handling

#### 4. Recovery Tool (`scripts/clear-walletconnect-storage.js`)
- Created a convenient script to manually clear corrupted storage
- Run with: `npm run clear:wc`
- Works via adb to clean the storage on a connected Android device

#### 5. Documentation (`ARRAYIFY_ERROR_FIX.md`)
- Complete documentation of the issue, fix, and recovery procedures

## 📱 How to Apply the Fix

### For Current Crashes:
If your app is currently crashing:

1. **Automatic Recovery** (Preferred):
   - The global error handler will now automatically clear the corrupted data
   - Just close and restart the app - it should work

2. **Manual Recovery** (if automatic doesn't work):
   ```bash
   # Run the cleaning script
   npm run clear:wc
   
   # Then restart the app
   npm run android:restart
   ```

3. **Last Resort** (if you have adb access):
   ```bash
   adb shell
   run-as com.malinwallet.app
   cd /data/data/com.malinwallet.app/files/RCTAsyncLocalStorage_V1
   rm -f *wc* *walletconnect* *@walletconnect*
   exit
   adb shell am force-stop com.malinwallet.app
   adb shell monkey -p com.malinwallet.app -c android.intent.category.LAUNCHER 1
   ```

### For Fresh Installs:
- The fixes are now in the code
- Corrupted storage will be automatically cleaned on initialization
- The app is much more resilient to this type of corruption

## ⚠️ Important Notes

1. **WalletConnect Sessions**: After clearing the storage, any active WalletConnect sessions will be lost and need to be re-paired with dApps

2. **Wallet Data**: This fix ONLY clears WalletConnect session data. Your wallet keys, balances, and transaction history are NOT affected

3. **Prevention**: The app now has multiple layers of protection:
   - Automatic corruption detection
   - Graceful degradation (app works without WalletConnect if needed)
   - Storage clearing on error
   - Delayed initialization to reduce timing issues

## 🔍 Technical Details

**Error Pattern:**
```
Error: invalid arrayify value (argument="value", value="[extremely long hex]", 
code=INVALID_ARGUMENT, version=bytes/5.8.0)
```

**Stack Trace:**
- `arrayify@1:5380512`
- `decode@1:5408505`
- `getData@1:5408140`

**Affected Libraries:**
- `@walletconnect/*` (stores session data)
- `ethers@6.16.0` (bytes@5.8.0 used for decoding)

**Thread:** `mqt_native_modules` (React Native bridge)

## 📦 Files Modified

1. ✏️ `index.js` - Global error handler
2. ✏️ `class/services/walletconnect-service.ts` - Storage clearing + error handling
3. ✏️ `components/Context/StorageProvider.tsx` - Delayed initialization
4. ✏️ `package.json` - Added clear:wc script
5. ➕ `scripts/clear-walletconnect-storage.js` - Recovery tool
6. ➕ `ARRAYIFY_ERROR_FIX.md` - Detailed documentation
7. ➕ `ARRAYIFY_FIX_SUMMARY.md` - This file

## 🎯 Next Steps

1. **Test the fix**: Run the app and verify it doesn't crash
2. **Rebuild if needed**: If you're testing a production build:
   ```bash
   cd android
   ./gradlew clean
   cd ..
   npm run android
   ```
3. **Monitor logs**: Watch for the cleanup messages in the console
4. **Report**: Let me know if the issue persists

The app should now be stable and resilient to this type of storage corruption! 🎉
