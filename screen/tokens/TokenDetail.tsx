// Copyright (C) 2026 MalinWallet Infrastructure - All Rights Reserved
import React from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  Image,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { Token, getChainConfig } from '../../class/services/token';
import { MalinText } from '../../MalinComponents';
import { useTheme } from '../../components/themes';
import { useExtendedNavigation } from '../../hooks/useExtendedNavigation';
import SafeArea from '../../components/SafeArea';
import Button from '../../components/Button';
import { SecondButton } from '../../components/SecondButton';
import { PriceChart } from '../../components/charts/PriceChart';

interface TokenDetailProps {
  route: {
    params: {
      token: Token;
    };
  };
}

const TokenDetail: React.FC<TokenDetailProps> = ({ route }) => {
  const { token } = route.params;
  const { colors } = useTheme();
  const navigation = useExtendedNavigation();

  const chain = getChainConfig(token.chainId);

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

  const formatMarketCap = (marketCap?: number) => {
    if (!marketCap) return 'N/A';
    if (marketCap >= 1e9) return `$${(marketCap / 1e9).toFixed(2)}B`;
    if (marketCap >= 1e6) return `$${(marketCap / 1e6).toFixed(2)}M`;
    if (marketCap >= 1e3) return `$${(marketCap / 1e3).toFixed(2)}K`;
    return formatPrice(marketCap);
  };

  const handleSend = () => {
    // Navigate to send screen with token
    navigation.navigate('SendDetailsRoot', {
      screen: 'SendDetails',
      params: {
        // Pass token details for sending
      },
    });
  };

  const handleSwap = () => {
    navigation.navigate('Swap');
  };

  const handleBridge = () => {
    navigation.navigate('BridgeScreen', { token });
  };

  const handleViewExplorer = () => {
    if (token.address === 'native') {
      // Native token - view chain explorer
      Linking.openURL(chain.explorerUrl);
    } else {
      // ERC-20 token - view token contract
      const url = `${chain.explorerUrl}/token/${token.address}`;
      Linking.openURL(url);
    }
  };

  const changeColor = token.priceChange24h && token.priceChange24h >= 0 ? '#10b981' : '#ef4444';

  return (
    <SafeArea style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Token Header */}
        <View style={styles.header}>
          {token.logo ? (
            <Image source={{ uri: token.logo }} style={styles.tokenIcon} />
          ) : (
            <View style={[styles.iconPlaceholder, { backgroundColor: colors.hdborderColor }]}>
              <MalinText style={styles.iconText}>{token.symbol[0]}</MalinText>
            </View>
          )}
          <MalinText style={[styles.tokenName, { color: colors.foregroundColor }]}>
            {token.name}
          </MalinText>
          <MalinText style={[styles.tokenSymbol, { color: colors.alternativeTextColor }]}>
            {token.symbol}
          </MalinText>
          {token.isNative && (
            <View style={[styles.badge, { backgroundColor: colors.hdborderColor }]}>
              <MalinText style={[styles.badgeText, { color: colors.foregroundColor }]}>
                Native Token
              </MalinText>
            </View>
          )}
        </View>

        {/* Balance Section */}
        <View style={[styles.balanceCard, { backgroundColor: colors.inputBackgroundColor }]}>
          <MalinText style={[styles.balanceLabel, { color: colors.alternativeTextColor }]}>
            Your Balance
          </MalinText>
          <MalinText style={[styles.balanceAmount, { color: colors.foregroundColor }]}>
            {formatBalance(token.balanceFormatted)} {token.symbol}
          </MalinText>
          {token.balanceUSD !== undefined && (
            <MalinText style={[styles.balanceUSD, { color: colors.alternativeTextColor }]}>
              ≈ {formatPrice(token.balanceUSD)}
            </MalinText>
          )}
        </View>

        {/* Price Chart */}
        {token.coingeckoId && token.price !== undefined && (
          <PriceChart
            tokenId={token.coingeckoId}
            symbol={token.symbol}
            currentPrice={token.price}
          />
        )}

        {/* Price Section */}
        {token.price !== undefined && (
          <View style={[styles.section, { backgroundColor: colors.inputBackgroundColor }]}>
            <MalinText style={[styles.sectionTitle, { color: colors.foregroundColor }]}>
              Price Information
            </MalinText>
            
            <View style={styles.infoRow}>
              <MalinText style={[styles.infoLabel, { color: colors.alternativeTextColor }]}>
                Current Price
              </MalinText>
              <MalinText style={[styles.infoValue, { color: colors.foregroundColor }]}>
                {formatPrice(token.price)}
              </MalinText>
            </View>

            {token.priceChange24h !== undefined && (
              <View style={styles.infoRow}>
                <MalinText style={[styles.infoLabel, { color: colors.alternativeTextColor }]}>
                  24h Change
                </MalinText>
                <MalinText style={[styles.infoValue, { color: changeColor }]}>
                  {token.priceChange24h >= 0 ? '+' : ''}
                  {token.priceChange24h.toFixed(2)}%
                </MalinText>
              </View>
            )}

            {token.marketCap !== undefined && (
              <View style={styles.infoRow}>
                <MalinText style={[styles.infoLabel, { color: colors.alternativeTextColor }]}>
                  Market Cap
                </MalinText>
                <MalinText style={[styles.infoValue, { color: colors.foregroundColor }]}>
                  {formatMarketCap(token.marketCap)}
                </MalinText>
              </View>
            )}
          </View>
        )}

        {/* Token Details */}
        <View style={[styles.section, { backgroundColor: colors.inputBackgroundColor }]}>
          <MalinText style={[styles.sectionTitle, { color: colors.foregroundColor }]}>
            Token Details
          </MalinText>
          
          <View style={styles.infoRow}>
            <MalinText style={[styles.infoLabel, { color: colors.alternativeTextColor }]}>
              Chain
            </MalinText>
            <View style={styles.chainInfo}>
              <Image source={{ uri: chain.logo }} style={styles.chainIcon} />
              <MalinText style={[styles.infoValue, { color: colors.foregroundColor }]}>
                {chain.name}
              </MalinText>
            </View>
          </View>

          {!token.isNative && (
            <View style={styles.infoRow}>
              <MalinText style={[styles.infoLabel, { color: colors.alternativeTextColor }]}>
                Contract
              </MalinText>
              <TouchableOpacity onPress={handleViewExplorer}>
                <MalinText
                  style={[styles.infoValueLink, { color: colors.buttonAlternativeTextColor }]}
                  numberOfLines={1}
                >
                  {token.address.slice(0, 6)}...{token.address.slice(-4)}
                </MalinText>
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.infoRow}>
            <MalinText style={[styles.infoLabel, { color: colors.alternativeTextColor }]}>
              Decimals
            </MalinText>
            <MalinText style={[styles.infoValue, { color: colors.foregroundColor }]}>
              {token.decimals}
            </MalinText>
          </View>

          <View style={styles.infoRow}>
            <MalinText style={[styles.infoLabel, { color: colors.alternativeTextColor }]}>
              Standard
            </MalinText>
            <MalinText style={[styles.infoValue, { color: colors.foregroundColor }]}>
              {token.standard}
            </MalinText>
          </View>

          {token.verified !== undefined && (
            <View style={styles.infoRow}>
              <MalinText style={[styles.infoLabel, { color: colors.alternativeTextColor }]}>
                Status
              </MalinText>
              <MalinText
                style={[
                  styles.infoValue,
                  { color: token.verified ? '#10b981' : colors.alternativeTextColor2 },
                ]}
              >
                {token.verified ? '✓ Verified' : 'Custom Token'}
              </MalinText>
            </View>
          )}
        </View>

        {/* Action Buttons */}
        <View style={styles.actions}>
          <Button
            title="Send"
            onPress={handleSend}
            // disabled={!token.balanceFormatted || parseFloat(token.balanceFormatted) === 0}
          />
          
          <View style={styles.buttonSpacing} />
          
          <SecondButton
            title="Swap"
            onPress={handleSwap}
          />
          
          <View style={styles.buttonSpacing} />
          
          <SecondButton
            title="Bridge"
            onPress={handleBridge}
          />
        </View>

        {/* View on Explorer */}
        <TouchableOpacity
          style={styles.explorerButton}
          onPress={handleViewExplorer}
        >
          <MalinText style={[styles.explorerText, { color: colors.buttonAlternativeTextColor }]}>
            View on {chain.name} Explorer →
          </MalinText>
        </TouchableOpacity>
      </ScrollView>
    </SafeArea>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  tokenIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 16,
  },
  iconPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconText: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  tokenName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  tokenSymbol: {
    fontSize: 16,
    marginBottom: 8,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 8,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  balanceCard: {
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  balanceLabel: {
    fontSize: 14,
    marginBottom: 8,
  },
  balanceAmount: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  balanceUSD: {
    fontSize: 18,
  },
  section: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: 14,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  infoValueLink: {
    fontSize: 14,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  chainInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  chainIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    marginRight: 8,
  },
  actions: {
    marginTop: 8,
  },
  buttonSpacing: {
    height: 12,
  },
  explorerButton: {
    alignItems: 'center',
    padding: 16,
  },
  explorerText: {
    fontSize: 14,
    fontWeight: '600',
  },
});

export default TokenDetail;
