// Copyright (C) 2026 MalinWallet Infrastructure - All Rights Reserved
import { EthereumWallet } from './ethereum-wallet';
import { Provider, Wallet } from 'zksync-ethers';
import { ethers } from 'ethers';
import { EthereumTransaction } from './types';

/**
 * zkSync Era Wallet
 * Extends EthereumWallet for zkSync L2 compatibility
 */
export class ZkSyncWallet extends EthereumWallet {
  static readonly type = 'zksync';
  static readonly typeReadable = 'zkSync Era';

  // @ts-ignore: override
  public readonly type = ZkSyncWallet.type;
  // @ts-ignore: override
  public readonly typeReadable = ZkSyncWallet.typeReadable;

  private _zkSyncProvider: Provider | null = null;
  private _zkSyncWallet: Wallet | null = null;

  static readonly ZKSYNC_MAINNET_RPC = 'https://mainnet.era.zksync.io';
  static readonly ZKSYNC_TESTNET_RPC = 'https://testnet.era.zksync.dev';

  constructor() {
    super();
    this.label = 'zkSync Era Wallet';
  }

  static fromJson(obj: string): ZkSyncWallet {
    const obj2 = JSON.parse(obj);
    const temp = new this();
    for (const key2 of Object.keys(obj2)) {
      // @ts-ignore
      temp[key2] = obj2[key2];
    }
    return temp;
  }

  /**
   * Get zkSync provider
   */
  private getProvider(): Provider {
    if (!this._zkSyncProvider) {
      this._zkSyncProvider = new Provider(ZkSyncWallet.ZKSYNC_MAINNET_RPC);
    }
    return this._zkSyncProvider;
  }

  /**
   * Get zkSync wallet instance
   */
  private getZkSyncWallet(): Wallet | null {
    if (!this.secret) return null;
    
    if (!this._zkSyncWallet) {
      const provider = this.getProvider();
      this._zkSyncWallet = new Wallet(this.secret, provider);
    }
    return this._zkSyncWallet;
  }

  /**
   * Fetch balance on zkSync
   */
  async fetchBalance(): Promise<void> {
    try {
      const provider = this.getProvider();
      if (this._address) {
        const balance = await provider.getBalance(this._address);
        this.balance = Number(ethers.formatEther(balance));
        console.log('zkSync Balance:', this.balance, 'ETH');
      }
    } catch (e) {
      console.error('Error fetching zkSync balance:', e);
    }
  }

  /**
   * Fetch transactions on zkSync
   * Note: zkSync Era doesn't have getHistory() like Etherscan
   * Would require zkSync block explorer API integration
   */
  async fetchTransactions(): Promise<void> {
    if (!this._address) return;

    try {
      const provider = this.getProvider();
      
      // Get recent block to verify connection
      const blockNumber = await provider.getBlockNumber();
      
      // Initialize transactions array
      // Note: Access parent class protected property safely
      (this as any)._transactions = [];
      
      console.log(`zkSync connected. Latest block: ${blockNumber}`);
    } catch (e) {
      console.error('Error fetching zkSync transactions:', e);
    }
  }

  /**
   * Create and send transaction on zkSync (renamed to avoid conflict with parent)
   */
  async sendZkSyncTransaction(
    to: string,
    amount: string,
    gasPrice?: string,
  ): Promise<string> {
    const wallet = this.getZkSyncWallet();
    if (!wallet) {
      throw new Error('Wallet not initialized');
    }

    try {
      const provider = this.getProvider();
      
      // Convert amount to Wei
      const value = ethers.parseEther(amount);

      // Get gas price (zkSync has different gas calculation)
      const feeData = await provider.getFeeData();
      const actualGasPrice = gasPrice 
        ? ethers.parseUnits(gasPrice, 'gwei')
        : feeData.gasPrice || ethers.parseUnits('0.25', 'gwei');

      const fromAddress = this._address || wallet.address;
      if (typeof fromAddress !== 'string') {
        throw new Error('Invalid wallet address');
      }

      // Estimate gas
      const gasLimit = await provider.estimateGas({
        from: fromAddress,
        to,
        value,
      });

      // Create transaction
      const tx = await wallet.sendTransaction({
        to,
        value,
        gasPrice: actualGasPrice,
        gasLimit,
      });

      console.log('zkSync transaction sent:', tx.hash);
      await tx.wait(); // Wait for confirmation

      return tx.hash;
    } catch (error: any) {
      console.error('zkSync transaction error:', error);
      throw new Error(`zkSync transaction failed: ${error.message}`);
    }
  }

  /**
   * Estimate gas for zkSync transaction
   */
  async estimateGas(to: string, amount: string): Promise<string> {
    try {
      const provider = this.getProvider();
      const wallet = this.getZkSyncWallet();
      if (!wallet) {
        throw new Error('Wallet not initialized');
      }
      
      const value = ethers.parseEther(amount);
      const fromAddress = this._address || wallet.address;
      if (typeof fromAddress !== 'string') {
        throw new Error('Invalid wallet address');
      }

      const gasLimit = await provider.estimateGas({
        from: fromAddress,
        to,
        value,
      });

      const feeData = await provider.getFeeData();
      const gasPrice = feeData.gasPrice || ethers.parseUnits('0.25', 'gwei');

      const gasCost = gasLimit * gasPrice;
      return ethers.formatEther(gasCost);
    } catch (error: any) {
      console.error('Gas estimation error:', error);
      return '0.001'; // Default fallback
    }
  }

  /**
   * Get zkSync network info
   */
  async getNetworkInfo(): Promise<{
    chainId: number;
    blockNumber: number;
    gasPrice: string;
  }> {
    const provider = this.getProvider();
    const network = await provider.getNetwork();
    const blockNumber = await provider.getBlockNumber();
    const feeData = await provider.getFeeData();

    return {
      chainId: Number(network.chainId),
      blockNumber,
      gasPrice: ethers.formatUnits(feeData.gasPrice || 0, 'gwei'),
    };
  }

  /**
   * Check if address is valid zkSync address (same as Ethereum)
   */
  static isValidAddress(address: string): boolean {
    return ethers.isAddress(address);
  }

  /**
   * Bridge ETH from L1 to zkSync (requires L1 wallet)
   */
  async bridgeFromL1(amount: string, l1PrivateKey: string): Promise<string> {
    try {
      // This requires L1 provider and zkSync bridge contract
      // Simplified implementation
      throw new Error('Bridge from L1 not yet implemented');
    } catch (error: any) {
      throw new Error(`Bridge failed: ${error.message}`);
    }
  }

  /**
   * Get allowListed flag (always true for EVM-compatible)
   */
  allowSendMax(): boolean {
    return true;
  }

  /**
   * Get chain identifier
   */
  getChainId(): number {
    return 324; // zkSync Era mainnet
  }

/**
 * Export for JSON serialization
 */
toJSON(): any {
  return {
    type: this.type,
    typeReadable: this.typeReadable,
    _address: this._address,
    secret: this.secret,
    label: this.label,
    balance: this.balance,
  };
}
}
