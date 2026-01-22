// Copyright (C) 2026 MalinWallet Infrastructure - All Rights Reserved
import { AbstractWallet } from './abstract-wallet';
import { BitcoinUnit, Chain } from '../../models/bitcoinUnits';
import { ethers } from 'ethers';
// @ts-ignore
import { ETHEREUM_RPC_URL } from '@env';
import { EthereumTransaction } from './types';

export class EthereumWallet extends AbstractWallet {
  static readonly type = 'ethereum';
  static readonly typeReadable = 'Ethereum';

  // @ts-ignore: override
  public readonly type = EthereumWallet.type;
  // @ts-ignore: override
  public readonly typeReadable = EthereumWallet.typeReadable;
  private _transactions: EthereumTransaction[] = [];

  constructor() {
    super();
    this.chain = Chain.OFFCHAIN;
    this.preferredBalanceUnit = BitcoinUnit.ETH;
  }

  static fromJson(obj: string): EthereumWallet {
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
    const timestamp = this._transactions[0]?.timestamp;
    return timestamp ? timestamp.toString() : 0;
  }

  async generate(): Promise<void> {
    const wallet = ethers.Wallet.createRandom();
    this.secret = wallet.privateKey;
    this._address = wallet.address;
    this.label = 'Ethereum Wallet';
  }

  getSecret(): string {
    return this.secret;
  }

  // Stubs to satisfy TypeScript and existing App logic

  async fetchBalance(): Promise<void> {
    try {
      const provider = new ethers.JsonRpcProvider(ETHEREUM_RPC_URL);
      if (this._address) {
        const balance = await provider.getBalance(this._address);
        // Store as ETH unit (float) to avoid Number overflow with Wei (18 decimals)
        // Compromise: AbstractWallet.balance is type number.
        this.balance = Number(ethers.formatEther(balance));
        console.log('ETH Balance:', this.balance);
      }
    } catch (e) {
      console.error('Error fetching ETH balance:', e);
    }
  }

  async fetchTransactions(): Promise<void> {
    if (!this._address) return;

    try {
      const provider = new ethers.EtherscanProvider('mainnet', 'freekey');
      const history = await (provider as any).getHistory(this._address);
      this._transactions = history.map((tx: any) => ({
        hash: tx.hash,
        from: tx.from,
        to: tx.to ?? '',
        value: Number(tx.value),
        gasPrice: Number(tx.gasPrice),
        gas: Number(tx.gasLimit),
        nonce: tx.nonce,
        input: tx.data,
        blockHash: tx.blockHash ?? '',
        blockNumber: tx.blockNumber ?? 0,
        confirmations: tx.confirmations ?? 0,
        timestamp: tx.timestamp ?? 0,
        fee: tx.gasPrice ? Number(tx.gasPrice * tx.gasLimit) : undefined,
      }));
    } catch (e) {
      console.error('Error fetching ETH transactions:', e);
    }
  }

  // @ts-ignore: override
  getTransactions(): EthereumTransaction[] {
    return this._transactions;
  }

  isAddressValid(address: string): boolean {
    return ethers.isAddress(address);
  }

  // Properties accessed by malin-app.ts but not present in AbstractWallet
  _txs_by_external_index: any = {};
  _txs_by_internal_index: any = {};

  timeToRefreshBalance(): boolean {
      return false; // For now
  }

  timeToRefreshTransaction(): boolean {
      return false; // For now
  }

  // CoinControl stubs
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
    const provider = new ethers.JsonRpcProvider(ETHEREUM_RPC_URL);
    try {
      const tx = await provider.broadcastTransaction(txhex);
      return tx.hash;
    } catch (e) {
      console.error('Error broadcasting ETH transaction:', e);
      throw e;
    }
  }

  coinselect(utxos: any, targets: any, feeRate: any) {
      return { inputs: [], outputs: [], fee: 0 };
  }

  _getWIFbyAddress(address: string) {
      return this.secret; // Simplify for now
  }
}
