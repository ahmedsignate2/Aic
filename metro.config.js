// Copyright (C) 2026 MalinWallet Infrastructure - All Rights Reserved
const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');
const path = require('path');

const config = {
  resolver: {
    extraNodeModules: {
      stream: require.resolve('stream-browserify'),
      crypto: require.resolve('crypto-browserify'),
      net: require.resolve('react-native-tcp-socket'),
      tls: require.resolve('react-native-tcp-socket'),
      buffer: require.resolve('buffer'),
      events: require.resolve('events'),
      url: require.resolve('url'),
    },
    resolveRequest: (context, moduleName, platform) => {
      if (moduleName === 'expo/fetch') {
        return {
          filePath: path.resolve(__dirname, 'mocks/expo-fetch.js'),
          type: 'sourceFile',
        };
      }
      // Fall back to the default resolver
      return context.resolveRequest(context, moduleName, platform);
    },
    sourceExts: ['ts', 'tsx', 'js', 'jsx', 'json'],
    assetExts: ['png', 'gif', 'jpg', 'jpeg', 'bmp', 'psd', 'svg', 'webp', 'm4v', 'mov', 'mp4', 'mpeg', 'mpg', 'webm', 'aac', 'aiff', 'caf', 'm4a', 'mp3', 'wav', 'html', 'pdf', 'bin', 'txt'],
  },
  transformer: {
    getTransformOptions: async () => ({
      transform: {
        experimentalImportSupport: false,
        inlineRequires: false,
      },
    }),
  },
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
