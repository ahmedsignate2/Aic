/**
 * Token Approval Service
 * Scan and revoke ERC20/ERC721/ERC1155 approvals
 */

import { ethers } from 'ethers';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { TokenApproval, ApprovalType, RiskLevel } from './types';

const CACHE_KEY_PREFIX = '@malinwallet:approvals:';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// ERC20 Approval event signature
const ERC20_APPROVAL_TOPIC = '0x8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925';
// ERC721 Approval event signature
const ERC721_APPROVAL_TOPIC = '0x8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925';
// ERC721 ApprovalForAll event signature
const ERC721_APPROVAL_ALL_TOPIC = '0x17307eab39ab6107e8899845ad3d59bd9653f200f220920489ca2b5937696c31';
// ERC1155 ApprovalForAll event signature
const ERC1155_APPROVAL_ALL_TOPIC = '0x17307eab39ab6107e8899845ad3d59bd9653f200f220920489ca2b5937696c31';

// Known DApp names
const KNOWN_SPENDERS: Record<string, string> = {
  '0x68b3465833fb72a70ecdf485e0e4c7bd8665fc45': 'Uniswap V3 Router 2',
  '0xe592427a0aece92de3edee1f18e0157c05861564': 'Uniswap V3 Router',
  '0x7a250d5630b4cf539739df2c5dacb4c659f2488d': 'Uniswap V2 Router',
  '0x1111111254eeb25477b68fb85ed929f73a960582': '1inch V5 Router',
  '0x00000000006c3852cbef3e08e8df289169ede581': 'OpenSea Seaport 1.1',
  '0x00000000000001ad428e4906ae43d8f9852d0dd6': 'OpenSea Seaport 1.4',
  '0x1e0049783f008a0085193e00003d00cd54003c71': 'OpenSea Seaport 1.5',
};

const ERC20_ABI = [
  'function allowance(address owner, address spender) view returns (uint256)',
  'function approve(address spender, uint256 amount) returns (bool)',
  'function decimals() view returns (uint8)',
  'function symbol() view returns (string)',
  'function name() view returns (string)',
];

const ERC721_ABI = [
  'function isApprovedForAll(address owner, address operator) view returns (bool)',
  'function setApprovalForAll(address operator, bool approved) returns (bool)',
  'function name() view returns (string)',
  'function symbol() view returns (string)',
];

export class ApprovalService {
  private static instance: ApprovalService;

  private constructor() {}

  static getInstance(): ApprovalService {
    if (!ApprovalService.instance) {
      ApprovalService.instance = new ApprovalService();
    }
    return ApprovalService.instance;
  }

  /**
   * Get all token approvals for an address
   */
  async getApprovals(
    address: string,
    chainId: number,
    rpcUrl: string,
  ): Promise<TokenApproval[]> {
    const cacheKey = `${CACHE_KEY_PREFIX}${chainId}:${address}`;

    // Check cache
    try {
      const cached = await AsyncStorage.getItem(cacheKey);
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < CACHE_DURATION) {
          return data;
        }
      }
    } catch (error) {
      console.log('Cache read error:', error);
    }

    // Fetch fresh data
    const approvals = await this.fetchApprovals(address, chainId, rpcUrl);

    // Cache results
    try {
      await AsyncStorage.setItem(
        cacheKey,
        JSON.stringify({ data: approvals, timestamp: Date.now() }),
      );
    } catch (error) {
      console.log('Cache write error:', error);
    }

    return approvals;
  }

  private async fetchApprovals(
    address: string,
    chainId: number,
    rpcUrl: string,
  ): Promise<TokenApproval[]> {
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const approvals: TokenApproval[] = [];

    try {
      // Get logs for Approval events
      // Note: In production, you'd want to use Etherscan API or similar
      // to get historical logs efficiently. This is a simplified version.
      
      // For demo, we'll check known DEX routers
      const knownSpenders = Object.keys(KNOWN_SPENDERS);
      
      for (const spenderAddress of knownSpenders) {
        // Check common tokens (USDT, USDC, DAI, etc.)
        const commonTokens = await this.getCommonTokens(chainId);
        
        for (const tokenAddress of commonTokens) {
          try {
            const approval = await this.checkERC20Approval(
              address,
              tokenAddress,
              spenderAddress,
              chainId,
              provider,
            );
            if (approval) {
              approvals.push(approval);
            }
          } catch (error) {
            // Token might not exist or not ERC20
            continue;
          }
        }
      }
    } catch (error) {
      console.error('Error fetching approvals:', error);
    }

    return approvals;
  }

  private async checkERC20Approval(
    owner: string,
    tokenAddress: string,
    spenderAddress: string,
    chainId: number,
    provider: ethers.JsonRpcProvider,
  ): Promise<TokenApproval | null> {
    try {
      const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, provider);
      
      const [allowance, symbol, name, decimals] = await Promise.all([
        tokenContract.allowance(owner, spenderAddress),
        tokenContract.symbol().catch(() => 'UNKNOWN'),
        tokenContract.name().catch(() => 'Unknown Token'),
        tokenContract.decimals().catch(() => 18),
      ]);

      // Check if allowance is non-zero
      if (allowance > 0n) {
        const maxUint256 = ethers.MaxUint256;
        const isUnlimited = allowance >= maxUint256 / 2n; // Consider > half maxUint256 as unlimited

        return {
          id: `${chainId}:${tokenAddress}:${spenderAddress}`,
          chainId,
          tokenAddress,
          tokenSymbol: symbol,
          tokenName: name,
          spenderAddress,
          spenderName: KNOWN_SPENDERS[spenderAddress.toLowerCase()] || 'Unknown DApp',
          allowance: isUnlimited ? 'unlimited' : ethers.formatUnits(allowance, decimals),
          approvalType: ApprovalType.ERC20,
          lastUpdated: Date.now(),
          riskLevel: isUnlimited ? RiskLevel.WARNING : RiskLevel.SAFE,
        };
      }
    } catch (error) {
      // Not an ERC20 or error reading
    }

    return null;
  }

  private async checkERC721Approval(
    owner: string,
    tokenAddress: string,
    operatorAddress: string,
    chainId: number,
    provider: ethers.JsonRpcProvider,
  ): Promise<TokenApproval | null> {
    try {
      const tokenContract = new ethers.Contract(tokenAddress, ERC721_ABI, provider);
      
      const [isApproved, symbol, name] = await Promise.all([
        tokenContract.isApprovedForAll(owner, operatorAddress),
        tokenContract.symbol().catch(() => 'NFT'),
        tokenContract.name().catch(() => 'NFT Collection'),
      ]);

      if (isApproved) {
        return {
          id: `${chainId}:${tokenAddress}:${operatorAddress}`,
          chainId,
          tokenAddress,
          tokenSymbol: symbol,
          tokenName: name,
          spenderAddress: operatorAddress,
          spenderName: KNOWN_SPENDERS[operatorAddress.toLowerCase()] || 'Unknown DApp',
          allowance: 'unlimited',
          approvalType: ApprovalType.ERC721,
          lastUpdated: Date.now(),
          riskLevel: RiskLevel.WARNING,
        };
      }
    } catch (error) {
      // Not an ERC721 or error reading
    }

    return null;
  }

  /**
   * Revoke ERC20 approval
   */
  async revokeERC20Approval(
    tokenAddress: string,
    spenderAddress: string,
    walletPrivateKey: string,
    rpcUrl: string,
  ): Promise<string> {
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const wallet = new ethers.Wallet(walletPrivateKey, provider);
    const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, wallet);

    // Set allowance to 0
    const tx = await tokenContract.approve(spenderAddress, 0);
    await tx.wait();

    return tx.hash;
  }

  /**
   * Revoke ERC721/ERC1155 approval
   */
  async revokeNFTApproval(
    tokenAddress: string,
    operatorAddress: string,
    walletPrivateKey: string,
    rpcUrl: string,
  ): Promise<string> {
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const wallet = new ethers.Wallet(walletPrivateKey, provider);
    const tokenContract = new ethers.Contract(tokenAddress, ERC721_ABI, wallet);

    // Set approval to false
    const tx = await tokenContract.setApprovalForAll(operatorAddress, false);
    await tx.wait();

    return tx.hash;
  }

  /**
   * Get common tokens for a chain
   */
  private async getCommonTokens(chainId: number): Promise<string[]> {
    const tokens: Record<number, string[]> = {
      1: [ // Ethereum
        '0xdAC17F958D2ee523a2206206994597C13D831ec7', // USDT
        '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', // USDC
        '0x6B175474E89094C44Da98b954EedeAC495271d0F', // DAI
        '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599', // WBTC
        '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', // WETH
      ],
      137: [ // Polygon
        '0xc2132D05D31c914a87C6611C10748AEb04B58e8F', // USDT
        '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174', // USDC
        '0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063', // DAI
        '0x1BFD67037B42Cf73acF2047067bd4F2C47D9BfD6', // WBTC
        '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270', // WMATIC
      ],
      56: [ // BSC
        '0x55d398326f99059fF775485246999027B3197955', // USDT
        '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d', // USDC
        '0x1AF3F329e8BE154074D8769D1FFa4eE058B1DBc3', // DAI
        '0x7130d2A12B9BCbFAe4f2634d864A1Ee1Ce3Ead9c', // BTCB
        '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c', // WBNB
      ],
    };

    return tokens[chainId] || [];
  }

  /**
   * Clear cache for address
   */
  async clearCache(address: string, chainId: number): Promise<void> {
    const cacheKey = `${CACHE_KEY_PREFIX}${chainId}:${address}`;
    await AsyncStorage.removeItem(cacheKey);
  }
}

export default ApprovalService.getInstance();
