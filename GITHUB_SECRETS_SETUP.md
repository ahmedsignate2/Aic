# GitHub Secrets Setup Guide

## Required Secrets for Android Build

### 1. Signing Keystore

**RELEASE_KEYSTORE_BASE64**
```bash
# The base64-encoded keystore is in: android/app/ci-release.keystore.b64
# Copy the entire content of this file to the secret value
cat android/app/ci-release.keystore.b64
```

**KEYSTORE_PASSWORD**
```
cipassword123
```

**KEY_ALIAS**
```
ci-key-alias
```

**KEY_PASSWORD**
```
cipassword123
```

### 2. API Keys (Already configured)
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

### 3. Firebase Configuration (Already configured)
- NEXT_PUBLIC_FIREBASE_API_KEY
- NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
- NEXT_PUBLIC_FIREBASE_PROJECT_ID
- NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
- NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
- NEXT_PUBLIC_FIREBASE_APP_ID
- NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID

## How to Add Secrets to GitHub

1. Go to your repository on GitHub
2. Click on **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add each secret with its name and value
5. For the keystore, copy the ENTIRE content of `android/app/ci-release.keystore.b64`

## Important Notes

⚠️ **The CI keystore (ci-release.keystore) is for CI/CD only**
- Do NOT use this for production releases to Google Play
- For production, generate a proper keystore and keep it secure
- Never commit keystores to the repository

📝 **The keystore files are in .gitignore**
- `ci-release.keystore` - The actual keystore (NOT in repo)
- `ci-release.keystore.b64` - Base64 encoded version (NOT in repo)
- Only add the base64 content to GitHub Secrets

## For Production Keystore

When ready for production, generate a proper keystore:
```bash
keytool -genkeypair -v -storetype PKCS12 \
  -keystore production-release.keystore \
  -alias production-key-alias \
  -keyalg RSA -keysize 2048 -validity 10000 \
  -storepass "YOUR_SECURE_PASSWORD" \
  -keypass "YOUR_SECURE_PASSWORD" \
  -dname "CN=MalinWallet, OU=Mobile, O=MalinWallet, L=City, ST=State, C=US"
```

Then encode and update GitHub Secrets:
```bash
base64 -w 0 production-release.keystore > production-release.keystore.b64
# Update RELEASE_KEYSTORE_BASE64 secret with new content
# Update passwords in secrets accordingly
```

**IMPORTANT:** Back up your production keystore securely! If you lose it, you cannot update your app on Google Play.
