// Copyright (C) 2026 MalinWallet Infrastructure - All Rights Reserved
import { AbstractWallet } from './abstract-wallet';
import { BitcoinUnit, Chain } from '../../models/bitcoinUnits';
import { Keypair, PublicKey, Connection, clusterApiUrl } from '@solana/web3.js';
import bs58 from 'bs58';
import { Buffer } from 'buffer';
import { SolanaTransaction } from './types';
import { SOLANA_RPC_URL } from '@env';

export class SolanaWallet extends AbstractWallet {
  static readonly type = 'solana';
  static readonly typeReadable = 'Solana';

  // @ts-ignore: override
  public readonly type = SolanaWallet.type;
  // @ts-ignore: override
  public readonly typeReadable = SolanaWallet.typeReadable;
  private _transactions: SolanaTransaction[] = [];

  constructor () {
    super();
    this.chain = Chain.OFFCHAIN;
    this.preferredBalanceUnit = BitcoinUnit.SOL;
  }

  static fromJson(obj: string): SolanaWallet {
    const obj2 = JSON.parse(obj);
    const temp = new this();
    for (const key2 of Object.keys(obj2)) {
      // @ts-ignore
      temp[key2] = obj2[key2];
    }
    return temp;
  }

  getBalance(): number {
    return this.balance;
  }

  getAddress(): string {
    return this._address as string;
  }

  getAddressAsync(): Promise<string> {
    return Promise.resolve(this.getAddress());
  }

  getLatestTransactionTime(): string | 0 {
    if (this._transactions.length === 0) {
      return 0;
    }
    return this._transactions[0].blockTime;
  }

  async generate(): Promise<void> {
    const keypair = Keypair.generate();
    this.secret = bs58.encode(keypair.secretKey);
    this._address = keypair.publicKey.toBase58();
    this.label = 'Solana Wallet';
  }

  getSecret(): string {
    return this.secret;
  }

  // Stubs

  async fetchBalance(): Promise<void> {
    try {
      const connection = new Connection(SOLANA_RPC_URL);
      if (this._address) {
        const publicKey = new PublicKey(this._address);
        const balance = await connection.getBalance(publicKey)
        this.balance = balance / 1e9 // Convert Lamports to SOL to match ETH float approach
        console.log('SOL Balance:', this.balance)
      }
    } catch (e) {
      console.error("Error fetching SOL balance:", e);
    }
  }

  async fetchTransactions(): Promise<void> {
    if (!this._address) return;

    try {
      const connection = new Connection(SOLANA_RPC_URL);
      const publicKey = new PublicKey(this._address);
      const signatures = await connection.getSignaturesForAddress(publicKey, { limit: 25 });
      const transactions = await connection.getParsedTransactions(signatures.map(s => s.signature));

      this._transactions = transactions
        .map((tx, i) => {
          if (!tx) return null;
          return {
            signature: signatures[i].signature,
            slot: tx.slot,
            blockTime: tx.blockTime ?? 0,
            memo: tx.transaction.message.instructions.find(
              (ix: any) => ix.programId.toBase58() === 'MemoSq4gqABAXKb96qnH8TysNcVnuizgaCkW19D2Hy'
            )?.data,
            fee: tx.meta?.fee ?? 0,
            preBalances: tx.meta?.preBalances ?? [],
            postBalances: tx.meta?.postBalances ?? [],
          };
        })
        .filter((tx): tx is SolanaTransaction => tx !== null);
    } catch (e) {
      console.error('Error fetching SOL transactions:', e);
    }
  }

  // @ts-ignore: override
  getTransactions(): SolanaTransaction[] {
    return this._transactions;
  }

  isAddressValid(address: string): boolean {
    try {
      new PublicKey(address);
      return true
    } catch (e) {
      return false;
    }
  }

  _txs_by_external_index: any = {};
  _txs_by_internal_index: any = {};

  timeToRefreshBalance (): boolean {
    return false;
  }

  timeToRefreshTransaction(): boolean {
    return false;
  }

  getUtxo() {
    return [];
  }

  async fetchUtxo() {
    // no-op
  }

  addressIsChange(address: string) {
    return false;
  }

  async broadcastTx(txhex: string): Promise<string> {
    const connection = new Connection(SOLANA_RPC_URL);
    try {
      const txBuffer = Buffer.from(txhex, 'hex');
      const signature = await connection.sendRawTransaction(txBuffer);
      return signature;
    } catch (e) {
      console.error('Error broadcasting SOL transaction:', e);
      throw e;
    }
  }

  coinselect(utxos: any, targets: any, feeRate: any) {
    return { inputs: [], outputs: [], fee: 0 };
  }

  _getWIFbyAddress(address: string) {
    return this.secret;
  }
}
