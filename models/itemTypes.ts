// Copyright (C) 2026 MalinWallet Infrastructure - All Rights Reserved
export enum ItemType {
  WalletSection = 'wallet',
  TransactionSection = 'transaction',
  AddressSection = 'address',
  WalletGroupSection = 'walletGroup',
}

export interface AddressItemData {
  address: string;
  walletID: string;
  index: number;
  isInternal: boolean;
}
