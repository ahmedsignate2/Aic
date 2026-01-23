# Build Notes

## Fixed Issues (2026-01-23)

### Android Build Fixes for React Native 0.78.2 + Gradle 8.12

#### 1. **react-native-scrypt** - Gradle 8 Compatibility
- **Issue**: Deprecated `compile` dependency declaration
- **Fix**: Changed to `implementation`
- **File**: `node_modules/react-native-scrypt/android/build.gradle`

#### 2. **@lodev09/react-native-true-sheet** - Kotlin val reassignment
- **Issue**: Trying to assign to read-only property `pointerEvents`
- **Fix**: Use setter method `setPointerEvents()`
- **Files**: `*ViewManager.kt` in true-sheet package

#### 3. **@react-native-menu/menu** - Kotlin val reassignment
- **Issues**: 
  - Trying to assign to `hitSlopRect` and `overflow` properties
  - Custom setter trying to reassign backing field
- **Fix**: 
  - Use setter methods `setHitSlopRect()` and `setOverflow()`
  - Use `field = value` in custom setter instead of property name
- **Files**: `MenuView.kt`, `MenuViewManagerBase.kt`

#### 4. **expo/fetch** - Missing module
- **Issue**: `@arkade-os/sdk` tries to import `expo/fetch` which doesn't exist
- **Fix**: Created mock module and added custom Metro resolver
- **Files**: `mocks/expo-fetch.js`, `metro.config.js`

#### 5. **AndroidManifest** - Firebase messaging conflict
- **Issue**: Conflicting values for `firebase_messaging_auto_init_enabled`
- **Fix**: Added `tools:replace="android:value"` attribute
- **File**: `android/app/src/main/AndroidManifest.xml`

#### 6. **Build Tools** - ARM64 compatibility attempt
- **Issue**: Android SDK build tools don't support ARM64 Linux natively
- **Attempted Fix**: Downgraded from 35.0.0 to 34.0.0 (didn't fully resolve)
- **Solution**: Use CI/CD (GitHub Actions) on x86-64 or Docker

## Building

### On GitHub Actions (Recommended)
```bash
# Push to main branch - workflow triggers automatically
git push origin main
```

### Locally on x86-64 (Linux/macOS/Windows)
```bash
cd android
./gradlew clean
./gradlew assembleRelease
```

### On ARM64 Linux (Experimental - via Docker)
See Docker build section below.

## GitHub Actions Workflow

The workflow automatically:
1. Patches all dependency issues
2. Creates expo/fetch mock
3. Fixes AndroidManifest conflicts
4. Loads secrets from GitHub environment
5. Builds release APK
6. Uploads artifact

### Required GitHub Secrets
- ETHEREUM_RPC_URL
- SOLANA_RPC_URL
- NEXT_PUBLIC_ALCHEMY_API_KEY
- NEXT_PUBLIC_HELIUS_API_KEY
- NEXT_PUBLIC_INFURA_GAS_API_KEY
- ZEROX_API_KEY
- NEXT_PUBLIC_ZEROX_API_KEY
- NEXT_PUBLIC_FEE_RECIPIENT
- NEXT_PUBLIC_LIFI_API_KEY
- NEXT_PUBLIC_TRANSAK_API_KEY
- NEXT_PUBLIC_GOPLUS_API_KEY
- GOPLUS_API_SECRET
- NEXT_PUBLIC_FIREBASE_API_KEY
- NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
- NEXT_PUBLIC_FIREBASE_PROJECT_ID
- NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
- NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
- NEXT_PUBLIC_FIREBASE_APP_ID
- NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
