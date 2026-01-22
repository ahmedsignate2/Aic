/**
 * Security Service Types
 * Types for approvals, simulations, whitelists, and spending limits
 */

export enum RiskLevel {
  SAFE = 'safe',
  WARNING = 'warning',
  DANGER = 'danger',
  UNKNOWN = 'unknown',
}

export enum ApprovalType {
  ERC20 = 'ERC20',
  ERC721 = 'ERC721',
  ERC1155 = 'ERC1155',
}

// Token Approvals
export interface TokenApproval {
  id: string; // unique identifier
  chainId: number;
  tokenAddress: string;
  tokenSymbol: string;
  tokenName: string;
  tokenLogo?: string;
  spenderAddress: string;
  spenderName?: string; // e.g., "Uniswap V3", "OpenSea"
  allowance: string; // "unlimited" or specific amount
  approvalType: ApprovalType;
  lastUpdated: number; // timestamp
  txHash?: string;
  riskLevel: RiskLevel;
}

// Transaction Simulation
export interface SimulationResult {
  success: boolean;
  gasUsed: string;
  gasPrice: string;
  totalCost: string; // in native token
  balanceChanges: BalanceChange[];
  events: SimulatedEvent[];
  error?: string;
  warnings: string[];
}

export interface BalanceChange {
  address: string;
  tokenAddress?: string; // undefined = native token
  tokenSymbol?: string;
  before: string;
  after: string;
  change: string; // positive = received, negative = sent
  usdValue?: string;
}

export interface SimulatedEvent {
  name: string;
  params: Record<string, any>;
  address: string;
}

// Security Check
export interface SecurityCheck {
  address: string;
  chainId: number;
  riskLevel: RiskLevel;
  riskScore: number; // 0-100
  isContract: boolean;
  isScam: boolean;
  isPhishing: boolean;
  isHoneypot: boolean;
  warnings: string[];
  checkedAt: number;
}

export interface TokenSecurityInfo extends SecurityCheck {
  tokenAddress: string;
  tokenSymbol: string;
  isOpenSource: boolean;
  canTakeBackOwnership: boolean;
  ownerChangeBalance: boolean;
  hiddenOwner: boolean;
  selfDestruct: boolean;
  externalCall: boolean;
  buyTax?: number;
  sellTax?: number;
  transferPausable: boolean;
  tradingCooldown: boolean;
}

// Whitelist
export interface WhitelistEntry {
  id: string;
  address: string;
  label: string;
  note?: string;
  addedAt: number;
  chainId?: number; // undefined = all chains
}

// Spending Limits
export enum LimitPeriod {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  PER_TRANSACTION = 'per_transaction',
}

export interface SpendingLimit {
  walletId: string;
  period: LimitPeriod;
  limitUSD: number; // limit in USD
  enabled: boolean;
  requirePIN: boolean; // require PIN to override
}

export interface SpendingRecord {
  walletId: string;
  period: LimitPeriod;
  periodStart: number; // timestamp of period start
  periodEnd: number; // timestamp of period end
  spentUSD: number; // total spent in period
  transactions: SpendingTransaction[];
}

export interface SpendingTransaction {
  txHash: string;
  timestamp: number;
  amountUSD: number;
  token: string;
  to: string;
  type: 'send' | 'swap' | 'approve' | 'stake';
}

// API Response Types
export interface GoPlusTokenSecurityResponse {
  code: number;
  message: string;
  result: {
    [tokenAddress: string]: {
      is_open_source: string;
      is_proxy: string;
      is_mintable: string;
      can_take_back_ownership: string;
      owner_change_balance: string;
      hidden_owner: string;
      selfdestruct: string;
      external_call: string;
      buy_tax: string;
      sell_tax: string;
      is_honeypot: string;
      transfer_pausable: string;
      is_blacklisted: string;
      is_whitelisted: string;
      trading_cooldown: string;
      is_anti_whale: string;
      holder_count: string;
      total_supply: string;
      holders: any[];
    };
  };
}

export interface GoPlusAddressSecurityResponse {
  code: number;
  message: string;
  result: {
    [address: string]: {
      is_contract: string;
      contract_name?: string;
      is_open_source?: string;
      is_proxy?: string;
      phishing_activities?: string;
      blacklist_type?: string;
      malicious_behavior?: string[];
    };
  };
}

export interface TenderlySimulationResponse {
  transaction: {
    status: boolean;
    gas_used: number;
    error_message?: string;
  };
  simulation: {
    id: string;
  };
  contracts: any[];
  asset_changes: Array<{
    asset_info: {
      standard: string;
      symbol: string;
      decimals: number;
      contract_address: string;
    };
    type: string;
    from: string;
    to: string;
    raw_amount: string;
    amount: string;
    dollar_value: string;
  }>;
}
