/**
 * Security Service
 * Scam/phishing detection using GoPlus Security API
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  SecurityCheck,
  TokenSecurityInfo,
  RiskLevel,
  GoPlusTokenSecurityResponse,
  GoPlusAddressSecurityResponse,
} from './types';

const CACHE_KEY_PREFIX = '@malinwallet:security:';
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour
const GOPLUS_API_BASE = 'https://api.gopluslabs.io/api/v1';

// Supported chains
const CHAIN_IDS: Record<number, string> = {
  1: '1',       // Ethereum
  56: '56',     // BSC
  137: '137',   // Polygon
  42161: '42161', // Arbitrum
  10: '10',     // Optimism
  43114: '43114', // Avalanche
};

export class SecurityService {
  private static instance: SecurityService;

  private constructor() {}

  static getInstance(): SecurityService {
    if (!SecurityService.instance) {
      SecurityService.instance = new SecurityService();
    }
    return SecurityService.instance;
  }

  /**
   * Check if address is safe (contract or EOA)
   */
  async checkAddress(
    address: string,
    chainId: number,
  ): Promise<SecurityCheck> {
    const cacheKey = `${CACHE_KEY_PREFIX}address:${chainId}:${address}`;

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

    // Fetch from API
    const result = await this.fetchAddressSecurity(address, chainId);

    // Cache result
    try {
      await AsyncStorage.setItem(
        cacheKey,
        JSON.stringify({ data: result, timestamp: Date.now() }),
      );
    } catch (error) {
      console.log('Cache write error:', error);
    }

    return result;
  }

  private async fetchAddressSecurity(
    address: string,
    chainId: number,
  ): Promise<SecurityCheck> {
    const chainIdStr = CHAIN_IDS[chainId];
    if (!chainIdStr) {
      return this.createUnknownCheck(address, chainId);
    }

    try {
      const url = `${GOPLUS_API_BASE}/address_security/${address}?chain_id=${chainIdStr}`;
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`GoPlus API error: ${response.status}`);
      }

      const data: GoPlusAddressSecurityResponse = await response.json();
      
      if (data.code !== 1 || !data.result) {
        throw new Error('Invalid response from GoPlus');
      }

      const addressData = data.result[address.toLowerCase()];
      if (!addressData) {
        return this.createUnknownCheck(address, chainId);
      }

      // Parse results
      const isContract = addressData.is_contract === '1';
      const isPhishing = addressData.phishing_activities === '1';
      const hasBlacklist = addressData.blacklist_type && addressData.blacklist_type !== '';
      const hasMalicious = addressData.malicious_behavior && addressData.malicious_behavior.length > 0;

      const warnings: string[] = [];
      if (isPhishing) warnings.push('⚠️ Known phishing address');
      if (hasBlacklist) warnings.push(`⚠️ Blacklisted: ${addressData.blacklist_type}`);
      if (hasMalicious) warnings.push(`⚠️ Malicious: ${addressData.malicious_behavior?.join(', ')}`);

      // Determine risk level
      let riskLevel = RiskLevel.SAFE;
      let riskScore = 0;

      if (isPhishing || hasMalicious) {
        riskLevel = RiskLevel.DANGER;
        riskScore = 100;
      } else if (hasBlacklist) {
        riskLevel = RiskLevel.DANGER;
        riskScore = 90;
      } else if (isContract) {
        riskLevel = RiskLevel.WARNING;
        riskScore = 30;
      }

      return {
        address,
        chainId,
        riskLevel,
        riskScore,
        isContract,
        isScam: hasMalicious || false,
        isPhishing,
        isHoneypot: false, // Only for tokens
        warnings,
        checkedAt: Date.now(),
      };
    } catch (error) {
      console.error('Error checking address security:', error);
      return this.createUnknownCheck(address, chainId);
    }
  }

  /**
   * Check token security
   */
  async checkToken(
    tokenAddress: string,
    chainId: number,
  ): Promise<TokenSecurityInfo> {
    const cacheKey = `${CACHE_KEY_PREFIX}token:${chainId}:${tokenAddress}`;

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

    // Fetch from API
    const result = await this.fetchTokenSecurity(tokenAddress, chainId);

    // Cache result
    try {
      await AsyncStorage.setItem(
        cacheKey,
        JSON.stringify({ data: result, timestamp: Date.now() }),
      );
    } catch (error) {
      console.log('Cache write error:', error);
    }

    return result;
  }

  private async fetchTokenSecurity(
    tokenAddress: string,
    chainId: number,
  ): Promise<TokenSecurityInfo> {
    const chainIdStr = CHAIN_IDS[chainId];
    if (!chainIdStr) {
      return this.createUnknownTokenCheck(tokenAddress, chainId);
    }

    try {
      const url = `${GOPLUS_API_BASE}/token_security/${chainIdStr}?contract_addresses=${tokenAddress}`;
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`GoPlus API error: ${response.status}`);
      }

      const data: GoPlusTokenSecurityResponse = await response.json();
      
      if (data.code !== 1 || !data.result) {
        throw new Error('Invalid response from GoPlus');
      }

      const tokenData = data.result[tokenAddress.toLowerCase()];
      if (!tokenData) {
        return this.createUnknownTokenCheck(tokenAddress, chainId);
      }

      // Parse security flags
      const isOpenSource = tokenData.is_open_source === '1';
      const canTakeBackOwnership = tokenData.can_take_back_ownership === '1';
      const ownerChangeBalance = tokenData.owner_change_balance === '1';
      const hiddenOwner = tokenData.hidden_owner === '1';
      const selfDestruct = tokenData.selfdestruct === '1';
      const externalCall = tokenData.external_call === '1';
      const isHoneypot = tokenData.is_honeypot === '1';
      const transferPausable = tokenData.transfer_pausable === '1';
      const tradingCooldown = tokenData.trading_cooldown === '1';

      const buyTax = parseFloat(tokenData.buy_tax) * 100; // Convert to percentage
      const sellTax = parseFloat(tokenData.sell_tax) * 100;

      // Build warnings
      const warnings: string[] = [];
      if (!isOpenSource) warnings.push('⚠️ Not open source');
      if (canTakeBackOwnership) warnings.push('🚨 Owner can take back ownership');
      if (ownerChangeBalance) warnings.push('🚨 Owner can change balances');
      if (hiddenOwner) warnings.push('⚠️ Hidden owner');
      if (selfDestruct) warnings.push('🚨 Self-destruct function present');
      if (isHoneypot) warnings.push('🚨 HONEYPOT DETECTED');
      if (transferPausable) warnings.push('⚠️ Transfers can be paused');
      if (buyTax > 10) warnings.push(`⚠️ High buy tax: ${buyTax.toFixed(1)}%`);
      if (sellTax > 10) warnings.push(`⚠️ High sell tax: ${sellTax.toFixed(1)}%`);
      if (tradingCooldown) warnings.push('⚠️ Trading cooldown enabled');

      // Calculate risk score
      let riskScore = 0;
      if (isHoneypot) riskScore += 100;
      if (canTakeBackOwnership) riskScore += 30;
      if (ownerChangeBalance) riskScore += 30;
      if (selfDestruct) riskScore += 25;
      if (hiddenOwner) riskScore += 15;
      if (!isOpenSource) riskScore += 10;
      if (buyTax > 10) riskScore += 10;
      if (sellTax > 10) riskScore += 10;
      if (transferPausable) riskScore += 10;
      if (externalCall) riskScore += 5;

      riskScore = Math.min(riskScore, 100);

      // Determine risk level
      let riskLevel = RiskLevel.SAFE;
      if (riskScore >= 80 || isHoneypot) {
        riskLevel = RiskLevel.DANGER;
      } else if (riskScore >= 40) {
        riskLevel = RiskLevel.WARNING;
      }

      return {
        address: tokenAddress,
        tokenAddress,
        tokenSymbol: 'TOKEN',
        chainId,
        riskLevel,
        riskScore,
        isContract: true,
        isScam: isHoneypot || canTakeBackOwnership || ownerChangeBalance,
        isPhishing: false,
        isHoneypot,
        warnings,
        checkedAt: Date.now(),
        isOpenSource,
        canTakeBackOwnership,
        ownerChangeBalance,
        hiddenOwner,
        selfDestruct,
        externalCall,
        buyTax: isNaN(buyTax) ? undefined : buyTax,
        sellTax: isNaN(sellTax) ? undefined : sellTax,
        transferPausable,
        tradingCooldown,
      };
    } catch (error) {
      console.error('Error checking token security:', error);
      return this.createUnknownTokenCheck(tokenAddress, chainId);
    }
  }

  private createUnknownCheck(address: string, chainId: number): SecurityCheck {
    return {
      address,
      chainId,
      riskLevel: RiskLevel.UNKNOWN,
      riskScore: 0,
      isContract: false,
      isScam: false,
      isPhishing: false,
      isHoneypot: false,
      warnings: ['⚠️ Unable to verify security'],
      checkedAt: Date.now(),
    };
  }

  private createUnknownTokenCheck(tokenAddress: string, chainId: number): TokenSecurityInfo {
    return {
      address: tokenAddress,
      tokenAddress,
      tokenSymbol: 'UNKNOWN',
      chainId,
      riskLevel: RiskLevel.UNKNOWN,
      riskScore: 0,
      isContract: true,
      isScam: false,
      isPhishing: false,
      isHoneypot: false,
      warnings: ['⚠️ Unable to verify security'],
      checkedAt: Date.now(),
      isOpenSource: false,
      canTakeBackOwnership: false,
      ownerChangeBalance: false,
      hiddenOwner: false,
      selfDestruct: false,
      externalCall: false,
      transferPausable: false,
      tradingCooldown: false,
    };
  }

  /**
   * Clear cache
   */
  async clearCache(): Promise<void> {
    const keys = await AsyncStorage.getAllKeys();
    const securityKeys = keys.filter(key => key.startsWith(CACHE_KEY_PREFIX));
    await AsyncStorage.multiRemove(securityKeys);
  }
}

export default SecurityService.getInstance();
