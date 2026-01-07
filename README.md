# MalinWallet - The Ultimate Multi-chain & AI-Secured Wallet

[![code style: prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat-square)](https://github.com/prettier/prettier)
**License:** Proprietary - All Rights Reserved  

MalinWallet is a high-performance, secure, and feature-rich non-custodial wallet designed for the modern crypto ecosystem. Built with React Native, it provides a unified experience for managing assets across multiple blockchains with an integrated AI security layer.

## 🚀 Key Features

* **Multi-chain Mastery:** Native support for **Bitcoin** (on-chain & Lightning), **Ethereum** (ERC20/NFTs), and **Solana** (SPL).
* **AI-Enhanced Security:** Integrated with **Google Gemini AI** for real-time transaction risk analysis and fraud detection.
* **Advanced Web3 Browser:** Seamlessly interact with DApps on ETH and SOL via the integrated secure browser.
* **True Self-Custody:** Your private keys remain encrypted on your device. Zero-knowledge architecture.
* **Gold Standard UX:** A premium "Gold" themed interface optimized for both beginners and pro users.

## 🛠 Tech Stack & Architecture

MalinWallet is the next generation of unified wallets. Our architecture is inspired by the industry's most robust open-source standards (including BlueWallet, AlphaWallet, and Mycelium) to create a more resilient and versatile solution.

## 📦 Build & Run

Ensure you are using the Node LTS version specified in `package.json`.

```bash
# Verify environment
node --version && npm --version

# Installation
git clone [https://github.com/amsss400/MW.git](https://github.com/amsss400/MW.git)
cd MW
npm install

# Run on Android
npx react-native run-android

# Run on iOS
npx pod-install
npm start
# Then in another terminal:
npx react-native run-ios
