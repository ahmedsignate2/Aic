// Copyright (C) 2026 MalinWallet Infrastructure - All Rights Reserved
module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint', 'jest', 'react', 'react-native', 'prettier'],
  extends: [
    '@react-native/eslint-config',
    'plugin:@typescript-eslint/recommended',
    'prettier',
    'standard',
    'standard-jsx',
    'standard-react',
  ],
  rules: {
    'prettier/prettier': 'error',
  },
}
