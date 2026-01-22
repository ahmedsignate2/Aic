// Copyright (C) 2026 MalinWallet Infrastructure - All Rights Reserved
import React, { useState, useEffect, useMemo } from 'react';
import {
  StyleSheet,
  View,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { Token, TokenService, ChainId, getChainConfig, Portfolio } from '../../class/services/token';
import { TokenCard } from '../../components/token/TokenCard';
import { ChainSelector } from '../../components/token/ChainSelector';
import { MalinText } from '../../MalinComponents';
import { useTheme } from '../../components/themes';
import { useExtendedNavigation } from '../../hooks/useExtendedNavigation';
import SafeArea from '../../components/SafeArea';
import Button from '../../components/Button';

interface TokenListProps {
  route: {
    params: {
      walletID: string;
      address: string;
      initialChainId?: ChainId;
    };
  };
}

const TokenList: React.FC<TokenListProps> = ({ route }) => {
  const { address, initialChainId = ChainId.ETHEREUM } = route.params;
  const { colors } = useTheme();
  const navigation = useExtendedNavigation();

  const [selectedChainId, setSelectedChainId] = useState<ChainId>(initialChainId);
  const [tokens, setTokens] = useState<Token[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadTokens();
  }, [address, selectedChainId]);

  const loadTokens = async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
      await TokenService.clearCache(address, selectedChainId);
    } else {
      setLoading(true);
    }

    setError(null);

    try {
      const result = await TokenService.fetchTokens({
        address,
        chainId: selectedChainId,
        includeNative: true,
        includeSpam: false,
      });

      // Sort by balance USD (highest first)
      const sorted = result.sort((a, b) => {
        const aValue = a.balanceUSD || 0;
        const bValue = b.balanceUSD || 0;
        return bValue - aValue;
      });

      setTokens(sorted);
    } catch (err: any) {
      console.error('Error loading tokens:', err);
      setError(err.message || 'Failed to load tokens');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleTokenPress = (token: Token) => {
    navigation.navigate('TokenDetail', { token });
  };

  const handleAddToken = () => {
    navigation.navigate('AddToken', { address, chainId: selectedChainId });
  };

  const handleChainChange = (chainId: ChainId) => {
    setSelectedChainId(chainId);
  };

  // Calculate portfolio totals
  const portfolio = useMemo<Portfolio>(() => {
    const totalValueUSD = tokens.reduce((sum, token) => sum + (token.balanceUSD || 0), 0);
    
    // Calculate weighted average change
    const weightedChange = tokens.reduce((sum, token) => {
      if (token.priceChange24h && token.balanceUSD) {
        return sum + (token.priceChange24h * token.balanceUSD);
      }
      return sum;
    }, 0);
    
    const change24h = totalValueUSD > 0 ? (weightedChange / totalValueUSD) : 0;
    const change24hUSD = totalValueUSD * (change24h / 100);

    return {
      totalValueUSD,
      change24h,
      change24hUSD,
      tokens,
      lastUpdated: Date.now(),
    };
  }, [tokens]);

  const formatPrice = (price: number) => {
    return `$${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const renderHeader = () => (
    <>
      {/* Chain Selector */}
      <ChainSelector
        selectedChainId={selectedChainId}
        onSelectChain={handleChainChange}
      />

      {/* Portfolio Summary */}
      <View style={[styles.portfolioCard, { backgroundColor: colors.inputBackgroundColor }]}>
        <MalinText style={[styles.portfolioLabel, { color: colors.alternativeTextColor }]}>
          Total Portfolio Value
        </MalinText>
        <MalinText style={[styles.portfolioValue, { color: colors.foregroundColor }]}>
          {formatPrice(portfolio.totalValueUSD)}
        </MalinText>
        {portfolio.change24h !== 0 && (
          <View style={styles.changeRow}>
            <MalinText
              style={[
                styles.changeValue,
                { color: portfolio.change24h >= 0 ? '#10b981' : '#ef4444' },
              ]}
            >
              {portfolio.change24h >= 0 ? '+' : ''}
              {formatPrice(portfolio.change24hUSD)}
            </MalinText>
            <MalinText
              style={[
                styles.changePercent,
                { color: portfolio.change24h >= 0 ? '#10b981' : '#ef4444' },
              ]}
            >
              ({portfolio.change24h >= 0 ? '+' : ''}
              {portfolio.change24h.toFixed(2)}%)
            </MalinText>
          </View>
        )}
        <MalinText style={[styles.portfolioSubtext, { color: colors.alternativeTextColor2 }]}>
          on {getChainConfig(selectedChainId).name}
        </MalinText>
      </View>

      {/* Header */}
      <View style={styles.header}>
        <MalinText style={[styles.headerTitle, { color: colors.foregroundColor }]}>
          Tokens ({tokens.length})
        </MalinText>
        <TouchableOpacity onPress={handleAddToken}>
          <MalinText style={[styles.addButton, { color: colors.buttonAlternativeTextColor }]}>
            + Add Token
          </MalinText>
        </TouchableOpacity>
      </View>
    </>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <MalinText style={[styles.emptyText, { color: colors.alternativeTextColor }]}>
        No tokens found
      </MalinText>
      <MalinText style={[styles.emptySubtext, { color: colors.alternativeTextColor2 }]}>
        Add a custom token to get started
      </MalinText>
      <View style={styles.emptyButton}>
        <Button title="Add Token" onPress={handleAddToken} />
      </View>
    </View>
  );

  if (loading) {
    return (
      <SafeArea style={[styles.container, { backgroundColor: colors.background }]}>
        {renderHeader()}
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.foregroundColor} />
          <MalinText style={[styles.loadingText, { color: colors.alternativeTextColor }]}>
            Loading tokens...
          </MalinText>
        </View>
      </SafeArea>
    );
  }

  if (error) {
    return (
      <SafeArea style={[styles.container, { backgroundColor: colors.background }]}>
        {renderHeader()}
        <View style={styles.errorContainer}>
          <MalinText style={[styles.errorText, { color: colors.redText }]}>
            {error}
          </MalinText>
          <Button title="Try Again" onPress={() => loadTokens()} />
        </View>
      </SafeArea>
    );
  }

  return (
    <SafeArea style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={tokens}
        keyExtractor={(item) => `${item.address}-${item.chainId}`}
        renderItem={({ item }) => (
          <TokenCard token={item} onPress={handleTokenPress} />
        )}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadTokens(true)}
            tintColor={colors.foregroundColor}
          />
        }
      />
    </SafeArea>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  portfolioCard: {
    padding: 24,
    borderRadius: 16,
    marginVertical: 16,
    alignItems: 'center',
  },
  portfolioLabel: {
    fontSize: 14,
    marginBottom: 8,
  },
  portfolioValue: {
    fontSize: 36,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  changeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  changeValue: {
    fontSize: 16,
    fontWeight: '600',
    marginRight: 8,
  },
  changePercent: {
    fontSize: 16,
    fontWeight: '600',
  },
  portfolioSubtext: {
    fontSize: 12,
    marginTop: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  addButton: {
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 60,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 20,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
  },
  emptyButton: {
    width: '100%',
    maxWidth: 200,
  },
});

export default TokenList;
