// Copyright (C) 2026 MalinWallet Infrastructure - All Rights Reserved
import * as bitcoin from 'bitcoinjs-lib';

export function isValidBech32Address(address: string): boolean {
  try {
    bitcoin.address.fromBech32(address);    
    return true;
  } catch (e) {
    return false;
  }
}