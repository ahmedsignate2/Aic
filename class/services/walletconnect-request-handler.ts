// Copyright (C) 2026 MalinWallet Infrastructure - All Rights Reserved
import { ethers } from 'ethers';
import { SignClientTypes } from '@walletconnect/types';
import { EthereumWallet } from '../wallets/ethereum-wallet';
import { SolanaWallet } from '../wallets/solana-wallet';
import WalletConnectService from './walletconnect-service';
import { Connection, Transaction, VersionedTransaction, PublicKey, Keypair } from '@solana/web3.js';
import bs58 from 'bs58';
// @ts-ignore
import { SOLANA_RPC_URL, ETHEREUM_RPC_URL } from '@env';

export class WalletConnectRequestHandler {
  /**
   * Handle Ethereum requests (eth_sendTransaction, personal_sign, etc.)
   */
  static async handleEthereumRequest(
    request: SignClientTypes.EventArguments['session_request'],
    wallet: EthereumWallet,
  ): Promise<any> {
    const { method, params } = request.params.request;

    switch (method) {
      case 'eth_sendTransaction':
        return await this.handleEthSendTransaction(params[0], wallet);

      case 'personal_sign':
        return await this.handlePersonalSign(params[0], params[1], wallet);

      case 'eth_sign':
        return await this.handleEthSign(params[0], params[1], wallet);

      case 'eth_signTypedData':
      case 'eth_signTypedData_v3':
      case 'eth_signTypedData_v4':
        return await this.handleSignTypedData(params[0], params[1], wallet);

      case 'eth_signTransaction':
        return await this.handleEthSignTransaction(params[0], wallet);

      default:
        throw new Error(`Unsupported method: ${method}`);
    }
  }

  /**
   * Handle Solana requests (solana_signTransaction, solana_signMessage, etc.)
   */
  static async handleSolanaRequest(
    request: SignClientTypes.EventArguments['session_request'],
    wallet: SolanaWallet,
  ): Promise<any> {
    const { method, params } = request.params.request;

    switch (method) {
      case 'solana_signTransaction':
        return await this.handleSolanaSignTransaction(params, wallet);

      case 'solana_signMessage':
        return await this.handleSolanaSignMessage(params, wallet);

      case 'solana_signAndSendTransaction':
        return await this.handleSolanaSignAndSendTransaction(params, wallet);

      default:
        throw new Error(`Unsupported Solana method: ${method}`);
    }
  }

  private static async handleEthSendTransaction(
    transaction: any,
    wallet: EthereumWallet,
  ): Promise<string> {
    // Get wallet's ethers wallet instance
    const privateKey = wallet.getSecret();
    const ethersWallet = new ethers.Wallet(privateKey);

    // Connect to provider
    const provider = new ethers.JsonRpcProvider(ETHEREUM_RPC_URL);
    const connectedWallet = ethersWallet.connect(provider);

    // Send transaction
    const tx = await connectedWallet.sendTransaction({
      to: transaction.to,
      value: transaction.value ? ethers.parseUnits(transaction.value, 'wei') : 0,
      data: transaction.data || '0x',
      gasLimit: transaction.gas,
      gasPrice: transaction.gasPrice,
      nonce: transaction.nonce,
    });

    return tx.hash;
  }

  private static async handlePersonalSign(
    message: string,
    address: string,
    wallet: EthereumWallet,
  ): Promise<string> {
    const privateKey = wallet.getSecret();
    const ethersWallet = new ethers.Wallet(privateKey);

    // Remove 0x prefix if present
    const messageToSign = message.startsWith('0x') ? message.slice(2) : message;

    // Sign the message
    const signature = await ethersWallet.signMessage(ethers.toUtf8Bytes(messageToSign));
    return signature;
  }

  private static async handleEthSign(
    address: string,
    data: string,
    wallet: EthereumWallet,
  ): Promise<string> {
    const privateKey = wallet.getSecret();
    const ethersWallet = new ethers.Wallet(privateKey);

    // Sign raw data
    const signature = await ethersWallet.signMessage(ethers.getBytes(data));
    return signature;
  }

  private static async handleSignTypedData(
    address: string,
    typedData: string,
    wallet: EthereumWallet,
  ): Promise<string> {
    const privateKey = wallet.getSecret();
    const ethersWallet = new ethers.Wallet(privateKey);

    // Parse typed data
    const data = typeof typedData === 'string' ? JSON.parse(typedData) : typedData;

    // Sign typed data (EIP-712)
    const { domain, types, message } = data;

    // Remove EIP712Domain from types if present
    const filteredTypes = { ...types };
    delete filteredTypes.EIP712Domain;

    const signature = await ethersWallet.signTypedData(domain, filteredTypes, message);
    return signature;
  }

  private static async handleEthSignTransaction(
    transaction: any,
    wallet: EthereumWallet,
  ): Promise<string> {
    const privateKey = wallet.getSecret();
    const ethersWallet = new ethers.Wallet(privateKey);

    // Sign transaction without broadcasting
    const signedTx = await ethersWallet.signTransaction({
      to: transaction.to,
      value: transaction.value || 0,
      data: transaction.data || '0x',
      gasLimit: transaction.gas,
      gasPrice: transaction.gasPrice,
      nonce: transaction.nonce,
      chainId: transaction.chainId || 1,
    });

    return signedTx;
  }

  /**
   * Solana: Sign a transaction
   * Params: { message: string (base64 or base58) }
   */
  private static async handleSolanaSignTransaction(
    params: any,
    wallet: SolanaWallet,
  ): Promise<{ signature: string }> {
    const { message } = params;

    // Get keypair from wallet
    const secretKey = bs58.decode(wallet.getSecret());
    const keypair = Keypair.fromSecretKey(secretKey);

    try {
      // Decode transaction (could be base64 or base58)
      let transactionBuffer: Buffer;
      
      try {
        // Try base64 first (most common)
        transactionBuffer = Buffer.from(message, 'base64');
      } catch {
        // Fallback to base58
        transactionBuffer = Buffer.from(bs58.decode(message));
      }

      // Deserialize transaction
      let transaction: Transaction | VersionedTransaction;
      try {
        transaction = Transaction.from(transactionBuffer);
      } catch {
        // Try versioned transaction
        transaction = VersionedTransaction.deserialize(transactionBuffer);
      }

      // Sign the transaction
      if (transaction instanceof Transaction) {
        transaction.sign(keypair);
        const serialized = transaction.serialize();
        return { signature: bs58.encode(serialized) };
      } else {
        transaction.sign([keypair]);
        const serialized = transaction.serialize();
        return { signature: bs58.encode(serialized) };
      }
    } catch (error) {
      console.error('Error signing Solana transaction:', error);
      throw new Error(`Failed to sign Solana transaction: ${error}`);
    }
  }

  /**
   * Solana: Sign a message
   * Params: { message: string (utf8 or base64), display?: string }
   */
  private static async handleSolanaSignMessage(
    params: any,
    wallet: SolanaWallet,
  ): Promise<{ signature: string }> {
    const { message, display } = params;

    // Get keypair from wallet
    const secretKey = bs58.decode(wallet.getSecret());
    const keypair = Keypair.fromSecretKey(secretKey);

    try {
      // Decode message
      let messageBytes: Uint8Array;
      
      if (display === 'utf8' || !message.match(/^[A-Za-z0-9+/=]+$/)) {
        // UTF-8 string
        messageBytes = new TextEncoder().encode(message);
      } else {
        // Base64 encoded
        messageBytes = Buffer.from(message, 'base64');
      }

      // Sign the message
      const signature = await (keypair as any).sign(messageBytes);
      
      return { signature: bs58.encode(signature) };
    } catch (error) {
      console.error('Error signing Solana message:', error);
      throw new Error(`Failed to sign Solana message: ${error}`);
    }
  }

  /**
   * Solana: Sign and send transaction
   * Params: { message: string (base64), options?: { skipPreflight?: boolean, preflightCommitment?: string } }
   */
  private static async handleSolanaSignAndSendTransaction(
    params: any,
    wallet: SolanaWallet,
  ): Promise<{ signature: string }> {
    const { message, options } = params;

    // Get keypair from wallet
    const secretKey = bs58.decode(wallet.getSecret());
    const keypair = Keypair.fromSecretKey(secretKey);

    try {
      // Decode and sign transaction
      const transactionBuffer = Buffer.from(message, 'base64');
      let transaction: Transaction | VersionedTransaction;

      try {
        transaction = Transaction.from(transactionBuffer);
      } catch {
        transaction = VersionedTransaction.deserialize(transactionBuffer);
      }

      // Sign
      if (transaction instanceof Transaction) {
        transaction.sign(keypair);
      } else {
        transaction.sign([keypair]);
      }

      // Send to network
      const connection = new Connection(SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com');
      
      const signature = await connection.sendRawTransaction(
        transaction instanceof Transaction ? transaction.serialize() : transaction.serialize(),
        {
          skipPreflight: options?.skipPreflight || false,
          preflightCommitment: options?.preflightCommitment || 'confirmed',
        },
      );

      return { signature };
    } catch (error) {
      console.error('Error signing and sending Solana transaction:', error);
      throw new Error(`Failed to sign and send Solana transaction: ${error}`);
    }
  }

  /**
   * Build a formatted response for WalletConnect
   */
  static buildResponse(id: number, result: any, error?: string): any {
    if (error) {
      return {
        id,
        jsonrpc: '2.0',
        error: {
          code: 5000,
          message: error,
        },
      };
    }

    return {
      id,
      jsonrpc: '2.0',
      result,
    };
  }

  /**
   * Approve a session request
   */
  static async approveRequest(
    topic: string,
    id: number,
    result: any,
  ): Promise<void> {
    const wcService = WalletConnectService;
    await wcService.respondSessionRequest(topic, {
      id,
      jsonrpc: '2.0',
      result,
    });
  }

  /**
   * Reject a session request
   */
  static async rejectRequest(
    topic: string,
    id: number,
    error: string,
  ): Promise<void> {
    const wcService = WalletConnectService;
    await wcService.respondSessionRequest(topic, {
      id,
      jsonrpc: '2.0',
      error: {
        code: 5000,
        message: error,
      },
    });
  }
}
