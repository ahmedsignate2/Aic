// Copyright (C) 2026 MalinWallet Infrastructure - All Rights Reserved
declare module 'react-native-passcode-auth' {
  declare function isSupported(): Promise<boolean>;
  declare function authenticate(): Promise<boolean>;
}
