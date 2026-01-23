// Copyright (C) 2026 MalinWallet Infrastructure - All Rights Reserved
// Type definitions for silent-payments package to fix node_modules errors

declare module 'silent-payments' {
  export class SilentPayment {
    static scanOutputs(params: any): any;
    static createOutputs(params: any): any;
    static createLabeledSilentPaymentAddress(params: any): any;
  }

  export enum UTXOType {
    P2PKH = 'p2pkh',
    P2WPKH = 'p2wpkh',
    P2SH_P2WPKH = 'p2sh-p2wpkh',
    P2TR = 'p2tr',
  }

  export interface UTXO {
    txid: string;
    vout: number;
    value: number;
    scriptPubKey: string;
    privateKey?: string;
  }
}
