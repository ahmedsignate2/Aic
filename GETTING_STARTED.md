# 🚀 MalinWallet - Guide d'Installation et Démarrage Complet

## Table of Contents
1. [Prérequis](#prérequis)
2. [Installation Initiale](#installation-initiale)
3. [Configuration Android](#configuration-android)
4. [Configuration iOS](#configuration-ios)
5. [Démarrage du Développement](#démarrage-du-développement)
6. [Build et Déploiement](#build-et-déploiement)
7. [Débogage](#débogage)
8. [Troubleshooting](#troubleshooting)

---

## Prérequis

### Versions Requises

```bash
# Node.js et npm
node --version  # v20.0.0 ou plus
npm --version   # v10.0.0 ou plus

# Java
java -version   # OpenJDK 11 ou plus

# Android
# - Android SDK 35
# - Android Build Tools 35.0.0
# - Android Emulator ou appareil physique

# iOS
# - Xcode 15.0 ou plus
# - CocoaPods 1.14.0 ou plus
# - macOS 13.0 ou plus
```

### Installation des Outils

#### macOS
```bash
# Installer Homebrew
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Installer Node.js
brew install node@20

# Installer Java
brew install openjdk@11

# Installer CocoaPods
sudo gem install cocoapods

# Installer Xcode Command Line Tools
xcode-select --install
```

#### Linux (Ubuntu/Debian)
```bash
# Mettre à jour les paquets
sudo apt update
sudo apt upgrade

# Installer Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Installer Java
sudo apt install -y openjdk-11-jdk

# Installer Android SDK
# Télécharger depuis https://developer.android.com/studio
```

#### Windows
```bash
# Installer Node.js depuis https://nodejs.org/
# Installer Java depuis https://www.oracle.com/java/technologies/downloads/
# Installer Android Studio depuis https://developer.android.com/studio
# Installer Git depuis https://git-scm.com/
```

---

## Installation Initiale

### 📄 Étape 1: Cloner le Repository

```bash
git clone https://github.com/amsss400/MW.git
cd MW
```

### 📄 Étape 2: Installer les Dépendances

```bash
# Installer les dépendances npm
npm install

# Vérifier l'installation
npm ls
```

### 📄 Étape 3: Configurer les Variables d'Environnement

```bash
# Créer un fichier .env
cat > .env << 'EOF'
NODE_ENV=development
DEBUG=*
EOF
```

### 📄 Étape 4: Vérifier la Configuration

```bash
# Vérifier TypeScript
npm run tslint

# Vérifier le linting
npm run lint

# Exécuter les tests
npm run test
```

---

## Configuration Android

### 📄 Étape 1: Configurer Android SDK

```bash
# Définir les variables d'environnement
export ANDROID_HOME=$HOME/Library/Android/sdk  # macOS
export ANDROID_HOME=$HOME/Android/Sdk          # Linux
export PATH=$PATH:$ANDROID_HOME/emulator
export PATH=$PATH:$ANDROID_HOME/tools
export PATH=$PATH:$ANDROID_HOME/tools/bin
export PATH=$PATH:$ANDROID_HOME/platform-tools

# Ajouter à ~/.bashrc ou ~/.zshrc pour les rendre permanentes
```

### 📄 Étape 2: Vérifier l'Installation Android

```bash
# Vérifier les SDK installés
$ANDROID_HOME/cmdline-tools/latest/bin/sdkmanager --list

# Installer les SDK manquants
$ANDROID_HOME/cmdline-tools/latest/bin/sdkmanager "platforms;android-35" "build-tools;35.0.0"
```

### 📄 Étape 3: Créer un Emulateur Android

```bash
# Lister les AVD disponibles
$ANDROID_HOME/emulator/emulator -list-avds

# Créer un nouvel AVD
$ANDROID_HOME/cmdline-tools/latest/bin/avdmanager create avd \
  -n MalinWallet_Emulator \
  -k "system-images;android-35;google_apis;arm64-v8a" \
  -d "Pixel 6"

# Lancer l'emulateur
$ANDROID_HOME/emulator/emulator -avd MalinWallet_Emulator
```

### 📄 Étape 4: Tester le Build Android

```bash
# Build Debug
cd android
./gradlew assembleDebug

# Build Release
./gradlew assembleRelease

# Installer sur l'emulateur
./gradlew installDebug
```

---

## Configuration iOS

### 📄 Étape 1: Installer les Pods

```bash
cd ios

# Nettoyer les pods existants
rm -rf Pods Podfile.lock

# Installer les pods
pod install --repo-update

cd ..
```

### 📄 Étape 2: Configurer Xcode

```bash
# Ouvrir le projet dans Xcode
open ios/MalinWallet.xcworkspace

# Dans Xcode :
# 1. Sélectionner le target "MalinWallet"
# 2. Aller à "Signing & Capabilities"
# 3. Sélectionner votre Team
# 4. Mettre à jour le Bundle Identifier à com.malinwallet.app
# 5. Vérifier que le Provisioning Profile est valide
```

### 📄 Étape 3: Tester le Build iOS

```bash
# Build Debug
xcodebuild -workspace ios/MalinWallet.xcworkspace \
  -scheme MalinWallet \
  -configuration Debug \
  -derivedDataPath build \
  -arch arm64

# Build Release
xcodebuild -workspace ios/MalinWallet.xcworkspace \
  -scheme MalinWallet \
  -configuration Release \
  -derivedDataPath build \
  -arch arm64
```

---

## Démarrage du Développement

### 📄 Démarrer le Serveur Metro

```bash
# Terminal 1: Démarrer Metro
npm start

# Ou avec reset du cache
npm start -- --reset-cache
```

### 📄 Lancer sur Android

```bash
# Terminal 2: Lancer sur Android
npm run android

# Ou manuellement
cd android
./gradlew installDebug
cd ..
```

### 📄 Lancer sur iOS

```bash
# Terminal 2: Lancer sur iOS
npm run ios

# Ou manuellement
xcodebuild -workspace ios/MalinWallet.xcworkspace \
  -scheme MalinWallet \
  -configuration Debug \
  -derivedDataPath build \
  -arch arm64 \
  install
```

---

## Build et Déploiement

### 📄 Build Android Release

```bash
cd android

# Build APK
./gradlew assembleRelease

# Build AAB (pour Google Play Store)
./gradlew bundleRelease

cd ..

# Les fichiers se trouvent dans :
# - APK: android/app/build/outputs/apk/release/
# - AAB: android/app/build/outputs/bundle/release/
```

### 📄 Build iOS Release

```bash
# Archive pour TestFlight
xcodebuild -workspace ios/MalinWallet.xcworkspace \
  -scheme MalinWallet \
  -configuration Release \
  -derivedDataPath build \
  -archivePath build/MalinWallet.xcarchive \
  archive

# Exporter l'archive
xcodebuild -exportArchive \
  -archivePath build/MalinWallet.xcarchive \
  -exportOptionsPlist ios/export_options.plist \
  -exportPath build/MalinWallet.ipa
```

---

## Débogage

### 📄 Logs Android

```bash
# Afficher les logs en temps réel
adb logcat

# Filtrer les logs MalinWallet
adb logcat | grep MalinWallet

# Sauvegarder les logs dans un fichier
adb logcat > logs.txt
```

### 📄 Logs iOS

```bash
# Afficher les logs dans Xcode
# Menu: Window > Devices and Simulators > [Device] > Console

# Ou via terminal
log stream --predicate 'process == "MalinWallet"'
```

### 📄 React Native Debugger

```bash
# Installer React Native Debugger
brew install react-native-debugger

# Lancer l'app avec le debugger
# Dans l'app, appuyer sur Cmd+D (iOS) ou Cmd+M (Android)
# Sélectionner "Debug JS Remotely"
```

### 📄 Chrome DevTools

```bash
# Ouvrir Chrome DevTools
# Dans l'app, appuyer sur Cmd+D (iOS) ou Cmd+M (Android)
# Sélectionner "Debug JS Remotely"
# Ouvrir http://localhost:8081/debugger-ui/
```

---

## Troubleshooting

### ❌ Erreur: "Cannot find module"

```bash
# Solution
rm -rf node_modules package-lock.json
npm cache clean --force
npm install
```

### ❌ Erreur: "Gradle build failed"

```bash
# Solution
cd android
./gradlew clean
./gradlew build --stacktrace
cd ..
```

### ❌ Erreur: "Metro bundler error"

```bash
# Solution
rm -rf /tmp/metro-cache
npm start -- --reset-cache
```

### ❌ Erreur: "Pod install failed"

```bash
# Solution
cd ios
rm -rf Pods Podfile.lock
pod repo update
pod install --repo-update
cd ..
```

### ❌ Erreur: "Xcode build failed"

```bash
# Solution
cd ios
xcodebuild clean -workspace MalinWallet.xcworkspace -scheme MalinWallet
xcodebuild -workspace MalinWallet.xcworkspace -scheme MalinWallet -configuration Debug
cd ..
```

---

## Commandes Utiles

```bash
# Développement
npm start                    # Démarrer Metro
npm run android              # Lancer sur Android
npm run ios                  # Lancer sur iOS
npm run lint                 # Vérifier le linting
npm run lint:fix             # Corriger les erreurs de linting
npm run test                 # Exécuter les tests

# Build
npm run android:clean        # Nettoyer Android
npm run clean:ios            # Nettoyer iOS
npm run clean                # Nettoyer tout

# Debugging
adb logcat                   # Logs Android
log stream                   # Logs iOS

# Nettoyage
rm -rf node_modules          # Supprimer node_modules
rm -rf android/.gradle       # Supprimer cache Gradle
rm -rf ios/Pods              # Supprimer pods iOS
rm -rf /tmp/metro-cache      # Supprimer cache Metro
```

---

## Checklist de Démarrage

- [ ] Node.js v20+ installé
- [ ] Java 11+ installé
- [ ] Android SDK configuré
- [ ] Xcode installé (macOS)
- [ ] CocoaPods installé (macOS)
- [ ] Repository cloné
- [ ] Dépendances npm installées
- [ ] Pods iOS installés
- [ ] Android Emulator lancé
- [ ] Metro serveur démarré
- [ ] App lancée sur Android
- [ ] App lancée sur iOS
- [ ] Tests passent
- [ ] Linting sans erreurs

---

**Last Updated:** 2026-01-05
**Status:** Active
**Maintainer:** MalinWallet Development Team
