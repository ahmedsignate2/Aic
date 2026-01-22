// Copyright (C) 2026 MalinWallet Infrastructure - All Rights Reserved
import { AbstractWallet } from './abstract-wallet';
import { BitcoinUnit, Chain } from '../../models/bitcoinUnits';
import { DirectSecp256k1HdWallet } from '@cosmjs/proto-signing';
import { SigningStargateClient, StargateClient } from '@cosmjs/stargate';
import { stringToPath } from '@cosmjs/crypto';

interface CosmosTransaction {
  hash: string;
  height: number;
  timestamp: number;
  from: string;
  to: string;
  amount: string;
  denom: string;
  memo?: string;
}

/**
 * Cosmos Hub Wallet (ATOM)
 * Supports Cosmos SDK chains with Tendermint consensus
 */
export class CosmosWallet extends AbstractWallet {
  static readonly type = 'cosmos';
  static readonly typeReadable = 'Cosmos';

  // @ts-ignore: override
  public readonly type = CosmosWallet.type;
  // @ts-ignore: override
  public readonly typeReadable = CosmosWallet.typeReadable;
  
  private _transactions: CosmosTransaction[] = [];
  private _mnemonic: string = '';
  
  // Bitcoin-specific properties (not used but required by TWallet interface)
  _txs_by_external_index: any = {};
  _txs_by_internal_index: any = {};
  
  // Bitcoin-specific methods (stubs for interface compatibility)
  timeToRefreshBalance(): boolean {
    return false;
  }
  
  timeToRefreshTransaction(): boolean {
    return false;
  }
  
  getUtxo(): any[] {
    return [];
  }
  
  isAddressValid(address: string): boolean {
    return address.startsWith('cosmos1') && address.length === 45;
  }
  
  coinselect(): any {
    throw new Error('Cosmos does not use UTXO coin selection');
  }
  
  fetchUtxo(): Promise<void> {
    return Promise.resolve();
  }
  
  addressIsChange(address: string): boolean {
    return false;
  }
  
  getUTXOMetadata(txid: string, vout: number): any {
    return { frozen: false, memo: '' };
  }
  
  // Cosmos Hub configuration
  static readonly RPC_ENDPOINT = 'https://cosmos-rpc.polkachu.com';
  static readonly REST_ENDPOINT = 'https://cosmos-rest.polkachu.com';
  static readonly CHAIN_ID = 'cosmoshub-4';
  static readonly PREFIX = 'cosmos';
  static readonly DENOM = 'uatom'; // micro ATOM (1 ATOM = 1,000,000 uatom)
  static readonly DECIMALS = 6;
  
  // BIP44 path for Cosmos: m/44'/118'/0'/0/0
  static readonly HD_PATH = "m/44'/118'/0'/0/0";

  constructor() {
    super();
    this.chain = Chain.OFFCHAIN;
    this.preferredBalanceUnit = BitcoinUnit.LOCAL_CURRENCY;
  }

  static fromJson(obj: string): CosmosWallet {
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
    return String(this._transactions[0].timestamp);
  }

  /**
   * Generate new Cosmos wallet with mnemonic
   */
  async generate(): Promise<void> {
    try {
      // Generate 24-word mnemonic
      const wallet = await DirectSecp256k1HdWallet.generate(24, {
        prefix: CosmosWallet.PREFIX,
        hdPaths: [stringToPath(CosmosWallet.HD_PATH)],
      });

      const [account] = await wallet.getAccounts();
      this._address = account.address;
      this._mnemonic = wallet.mnemonic;
      this.secret = this._mnemonic; // Store mnemonic as secret
      this.label = 'Cosmos Wallet';
      
      console.log('Cosmos wallet generated:', this._address);
    } catch (error) {
      console.error('Error generating Cosmos wallet:', error);
      throw error;
    }
  }

  /**
   * Get wallet from mnemonic
   */
  private async getWallet(): Promise<DirectSecp256k1HdWallet | null> {
    if (!this.secret && !this._mnemonic) return null;
    
    const mnemonic = this.secret || this._mnemonic;
    
    try {
      const wallet = await DirectSecp256k1HdWallet.fromMnemonic(mnemonic, {
        prefix: CosmosWallet.PREFIX,
        hdPaths: [stringToPath(CosmosWallet.HD_PATH)],
      });
      return wallet;
    } catch (error) {
      console.error('Error restoring Cosmos wallet:', error);
      return null;
    }
  }

  getSecret(): string {
    return this.secret || this._mnemonic;
  }

  /**
   * Fetch ATOM balance
   */
  async fetchBalance(): Promise<void> {
    if (!this._address) return;

    try {
      const client = await StargateClient.connect(CosmosWallet.RPC_ENDPOINT);
      const balance = await client.getBalance(this._address, CosmosWallet.DENOM);
      
      // Convert uatom to ATOM (divide by 1,000,000)
      this.balance = Number(balance.amount) / Math.pow(10, CosmosWallet.DECIMALS);
      
      console.log('Cosmos balance:', this.balance, 'ATOM');
      client.disconnect();
    } catch (e) {
      console.error('Error fetching Cosmos balance:', e);
    }
  }

  /**
   * Fetch transactions
   * Note: Requires REST API integration for full history
   */
  async fetchTransactions(): Promise<void> {
    if (!this._address) return;

    try {
      // Connect to get basic chain info
      const client = await StargateClient.connect(CosmosWallet.RPC_ENDPOINT);
      const height = await client.getHeight();
      
      // Initialize empty for now
      // To implement: Use Cosmos REST API /cosmos/tx/v1beta1/txs
      this._transactions = [];
      
      console.log(`Cosmos connected. Latest height: ${height}`);
      client.disconnect();
    } catch (e) {
      console.error('Error fetching Cosmos transactions:', e);
    }
  }

  /**
   * Send ATOM transaction (override but keep different signature for Cosmos-specific logic)
   */
  async sendTransaction(
    to: string,
    amount: string,
    memo?: string,
  ): Promise<string> {
    const wallet = await this.getWallet();
    if (!wallet) {
      throw new Error('Wallet not initialized');
    }

    try {
      const client = await SigningStargateClient.connectWithSigner(
        CosmosWallet.RPC_ENDPOINT,
        wallet,
      );

      const [account] = await wallet.getAccounts();
      
      // Convert ATOM to uatom
      const amountInMicroAtom = Math.floor(
        parseFloat(amount) * Math.pow(10, CosmosWallet.DECIMALS)
      );

      // Send transaction
      const result = await client.sendTokens(
        account.address,
        to,
        [{ denom: CosmosWallet.DENOM, amount: String(amountInMicroAtom) }],
        {
          amount: [{ denom: CosmosWallet.DENOM, amount: '5000' }], // 0.005 ATOM fee
          gas: '200000',
        },
        memo || '',
      );

      console.log('Cosmos transaction sent:', result.transactionHash);
      client.disconnect();
      return result.transactionHash;
    } catch (error: any) {
      console.error('Cosmos transaction error:', error);
      throw new Error(`Transaction failed: ${error.message}`);
    }
  }

  /**
   * Estimate transaction fee
   */
  async estimateFee(to: string, amount: string): Promise<string> {
    try {
      // Cosmos has predictable fees
      // Typical send: 0.005 ATOM
      return '0.005';
    } catch (error) {
      return '0.005'; // Default fallback
    }
  }

  /**
   * Get delegation info (staking)
   */
  async getDelegations(): Promise<any[]> {
    if (!this._address) return [];

    try {
      const client = await StargateClient.connect(CosmosWallet.RPC_ENDPOINT);
      const delegations = await client.getBalanceStaked(this._address);
      client.disconnect();
      
      return delegations ? [delegations] : [];
    } catch (error) {
      console.error('Error fetching delegations:', error);
      return [];
    }
  }

  /**
   * Validate Cosmos address
   */
  static isValidAddress(address: string): boolean {
    return address.startsWith('cosmos1') && address.length === 45;
  }

  /**
   * Get chain info
   */
  async getChainInfo(): Promise<{
    chainId: string;
    height: number;
  }> {
    const client = await StargateClient.connect(CosmosWallet.RPC_ENDPOINT);
    const height = await client.getHeight();
    client.disconnect();

    return {
      chainId: CosmosWallet.CHAIN_ID,
      height,
    };
  }

  allowSendMax(): boolean {
    return true;
  }

  getChainId(): string {
    return CosmosWallet.CHAIN_ID;
  }

  toJSON(): any {
    return {
      type: this.type,
      typeReadable: this.typeReadable,
      _mnemonic: this._mnemonic,
    };
  }
}
