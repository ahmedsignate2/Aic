// Copyright (C) 2026 MalinWallet Infrastructure - All Rights Reserved
import React from 'react';
import { StyleSheet, View, Image, TouchableOpacity } from 'react-native';
import { Token } from '../../class/services/token';
import { MalinText } from '../../MalinComponents';
import { useTheme } from '../themes';

interface TokenCardProps {
  token: Token;
  onPress?: (token: Token) => void;
  showBalance?: boolean;
  showValue?: boolean;
}

export const TokenCard: React.FC<TokenCardProps> = ({
  token,
  onPress,
  showBalance = true,
  showValue = true,
}) => {
  const { colors } = useTheme();

  const formatBalance = (balance?: string) => {
    if (!balance) return '0';
    const num = parseFloat(balance);
    if (num === 0) return '0';
    if (num < 0.000001) return '< 0.000001';
    if (num < 1) return num.toFixed(6);
    if (num < 1000) return num.toFixed(4);
    return num.toLocaleString(undefined, { maximumFractionDigits: 2 });
  };

  const formatPrice = (price?: number) => {
    if (!price) return '$0.00';
    if (price < 0.01) return `$${price.toFixed(6)}`;
    return `$${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatChangePercent = (change?: number) => {
    if (!change) return '';
    const sign = change >= 0 ? '+' : '';
    return `${sign}${change.toFixed(2)}%`;
  };

  const changeColor = token.priceChange24h && token.priceChange24h >= 0 ? '#10b981' : '#ef4444';

  return (
    <TouchableOpacity
      style={[styles.container, { backgroundColor: colors.inputBackgroundColor }]}
      onPress={() => onPress?.(token)}
      activeOpacity={0.7}
    >
      {/* Token Icon */}
      <View style={styles.iconContainer}>
        {token.logo ? (
          <Image source={{ uri: token.logo }} style={styles.icon} />
        ) : (
          <View style={[styles.iconPlaceholder, { backgroundColor: colors.hdborderColor }]}>
            <MalinText style={styles.iconText}>{token.symbol[0]}</MalinText>
          </View>
        )}
      </View>

      {/* Token Info */}
      <View style={styles.info}>
        <View style={styles.row}>
          <MalinText style={[styles.symbol, { color: colors.foregroundColor }]}>
            {token.symbol}
          </MalinText>
          {token.isNative && (
            <View style={[styles.badge, { backgroundColor: colors.hdborderColor }]}>
              <MalinText style={[styles.badgeText, { color: colors.foregroundColor }]}>
                Native
              </MalinText>
            </View>
          )}
        </View>
        <MalinText style={[styles.name, { color: colors.alternativeTextColor }]}>
          {token.name}
        </MalinText>
      </View>

      {/* Balance & Value */}
      <View style={styles.amounts}>
        {showBalance && (
          <MalinText style={[styles.balance, { color: colors.foregroundColor }]}>
            {formatBalance(token.balanceFormatted)} {token.symbol}
          </MalinText>
        )}
        {showValue && token.balanceUSD !== undefined && (
          <MalinText style={[styles.value, { color: colors.alternativeTextColor }]}>
            {formatPrice(token.balanceUSD)}
          </MalinText>
        )}
        {token.priceChange24h !== undefined && (
          <MalinText style={[styles.change, { color: changeColor }]}>
            {formatChangePercent(token.priceChange24h)}
          </MalinText>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  iconContainer: {
    marginRight: 12,
  },
  icon: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  iconPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  info: {
    flex: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  symbol: {
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 8,
  },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '600',
  },
  name: {
    fontSize: 13,
  },
  amounts: {
    alignItems: 'flex-end',
  },
  balance: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  value: {
    fontSize: 13,
    marginBottom: 2,
  },
  change: {
    fontSize: 12,
    fontWeight: '600',
  },
});
