// Copyright (C) 2026 MalinWallet Infrastructure - All Rights Reserved
import { Core } from '@walletconnect/core';
import { Web3Wallet, IWeb3Wallet } from '@walletconnect/web3wallet';
import { SessionTypes, SignClientTypes, ProposalTypes } from '@walletconnect/types';
import AsyncStorage from '@react-native-async-storage/async-storage';
// @ts-ignore
import { WALLETCONNECT_PROJECT_ID } from '@env';

export interface WalletConnectSession {
  topic: string;
  peerMeta: {
    name: string;
    description: string;
    url: string;
    icons: string[];
  };
  chains: string[];
  accounts: string[];
  expiry: number;
}

export class WalletConnectService {
  private static instance: WalletConnectService;
  private web3wallet: IWeb3Wallet | null = null;
  private initialized = false;

  static getInstance(): WalletConnectService {
    if (!WalletConnectService.instance) {
      WalletConnectService.instance = new WalletConnectService();
    }
    return WalletConnectService.instance;
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      const core = new Core({
        projectId: WALLETCONNECT_PROJECT_ID,
      });

      this.web3wallet = await Web3Wallet.init({
        core: core as any, // Type compatibility workaround
        metadata: {
          name: 'MalinWallet',
          description: 'Secure multi-chain crypto wallet with AI-enhanced security',
          url: 'https://w-malin.tech',
          icons: ['https://w-malin.tech/icon.png'],
        },
      });

      this.setupEventListeners();
      this.initialized = true;
      console.log('WalletConnect initialized');
    } catch (error) {
      console.error('Failed to initialize WalletConnect:', error);
      throw error;
    }
  }

  private setupEventListeners(): void {
    if (!this.web3wallet) return;

    // Session proposal
    this.web3wallet.on('session_proposal', this.onSessionProposal.bind(this));

    // Session request (sign transaction, sign message, etc.)
    this.web3wallet.on('session_request', this.onSessionRequest.bind(this));

    // Session delete
    this.web3wallet.on('session_delete', this.onSessionDelete.bind(this));
  }

  private onSessionProposal(proposal: SignClientTypes.EventArguments['session_proposal']): void {
    console.log('Session proposal received:', proposal);
    // This will be handled by UI component
  }

  private onSessionRequest(request: SignClientTypes.EventArguments['session_request']): void {
    console.log('Session request received:', request);
    // This will be handled by UI component
  }

  private onSessionDelete(data: SignClientTypes.EventArguments['session_delete']): void {
    console.log('Session deleted:', data);
    // Clean up session data
  }

  async pair(uri: string): Promise<void> {
    if (!this.web3wallet) {
      throw new Error('WalletConnect not initialized');
    }

    try {
      await this.web3wallet.core.pairing.pair({ uri });
      console.log('Pairing successful');
    } catch (error) {
      console.error('Pairing failed:', error);
      throw error;
    }
  }

  async approveSession(
    proposal: ProposalTypes.Struct,
    accounts: string[],
  ): Promise<SessionTypes.Struct> {
    if (!this.web3wallet) {
      throw new Error('WalletConnect not initialized');
    }

    try {
      const { id, params } = proposal as any;
      const requiredNamespaces = params?.requiredNamespaces || {};
      const optionalNamespaces = params?.optionalNamespaces || {};

      // Build namespaces from required + optional
      const namespaces: SessionTypes.Namespaces = {};

      // Handle EIP155 (Ethereum + EVM chains)
      if (requiredNamespaces.eip155) {
        const chains = requiredNamespaces.eip155.chains || ['eip155:1'];
        const methods = requiredNamespaces.eip155.methods || [];
        const events = requiredNamespaces.eip155.events || [];

        namespaces.eip155 = {
          chains,
          methods,
          events,
          accounts: chains.map((chain: string) => `${chain}:${accounts[0]}`),
        };
      }

      // Handle Solana
      if (requiredNamespaces.solana) {
        const chains = requiredNamespaces.solana.chains || ['solana:4sGjMW1sUnHzSxGspuhpqLDx6wiyjNtZ'];
        const methods = requiredNamespaces.solana.methods || [];
        const events = requiredNamespaces.solana.events || [];

        namespaces.solana = {
          chains,
          methods,
          events,
          accounts: chains.map((chain: string) => `${chain}:${accounts[1] || accounts[0]}`),
        };
      }

      const session = await this.web3wallet.approveSession({
        id,
        namespaces,
      });

      console.log('Session approved:', session.topic);
      return session;
    } catch (error) {
      console.error('Failed to approve session:', error);
      throw error;
    }
  }

  async rejectSession(proposalId: number, reason: string): Promise<void> {
    if (!this.web3wallet) {
      throw new Error('WalletConnect not initialized');
    }

    try {
      await this.web3wallet.rejectSession({
        id: proposalId,
        reason: {
          code: 5000,
          message: reason,
        },
      });
      console.log('Session rejected');
    } catch (error) {
      console.error('Failed to reject session:', error);
      throw error;
    }
  }

  async disconnectSession(topic: string): Promise<void> {
    if (!this.web3wallet) {
      throw new Error('WalletConnect not initialized');
    }

    try {
      await this.web3wallet.disconnectSession({
        topic,
        reason: {
          code: 6000,
          message: 'User disconnected',
        },
      });
      console.log('Session disconnected');
    } catch (error) {
      console.error('Failed to disconnect session:', error);
      throw error;
    }
  }

  getActiveSessions(): SessionTypes.Struct[] {
    if (!this.web3wallet) {
      return [];
    }

    const sessions = this.web3wallet.getActiveSessions();
    return Object.values(sessions);
  }

  async respondSessionRequest(topic: string, response: any): Promise<void> {
    if (!this.web3wallet) {
      throw new Error('WalletConnect not initialized');
    }

    try {
      await this.web3wallet.respondSessionRequest({
        topic,
        response,
      });
      console.log('Session request responded');
    } catch (error) {
      console.error('Failed to respond to session request:', error);
      throw error;
    }
  }

  // Storage helpers
  async saveSessions(): Promise<void> {
    const sessions = this.getActiveSessions();
    await AsyncStorage.setItem('walletconnect_sessions', JSON.stringify(sessions));
  }

  async loadSessions(): Promise<void> {
    // Sessions are automatically restored by Web3Wallet from storage
    console.log('Sessions loaded from storage');
  }

  // Get the web3wallet instance for advanced usage
  getWeb3Wallet(): IWeb3Wallet | null {
    return this.web3wallet;
  }
}

export default WalletConnectService.getInstance();
