// Copyright (C) 2026 MalinWallet Infrastructure - All Rights Reserved
// main index.js

import { NativeModules } from 'react-native';

const { BwFileAccess } = NativeModules;

export function readFile(filePath: string): Promise<string> {
  return BwFileAccess.readFileContent(filePath);
}

export default BwFileAccess;
