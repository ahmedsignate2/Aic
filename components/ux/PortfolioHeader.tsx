/**
 * Portfolio Header Component
 * Display total portfolio value and 24h change
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { PortfolioSummary } from '../../class/services/ux/portfolio-homepage-service';

interface PortfolioHeaderProps {
  summary: PortfolioSummary | null;
  loading: boolean;
  onRefresh?: () => void;
}

export const PortfolioHeader: React.FC<PortfolioHeaderProps> = ({
  summary,
  loading,
  onRefresh,
}) => {
  const formatCurrency = (value: number) => {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(2)}M`;
    }
    if (value >= 1000) {
      return `$${(value / 1000).toFixed(2)}K`;
    }
    return `$${value.toFixed(2)}`;
  };

  const formatChange = (change: number) => {
    const sign = change >= 0 ? '+' : '';
    return `${sign}${change.toFixed(2)}%`;
  };

  const getChangeColor = (change: number) => {
    if (change > 0) return '#4caf50';
    if (change < 0) return '#ff4444';
    return '#999';
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#2196f3" />
        <Text style={styles.loadingText}>Loading portfolio...</Text>
      </View>
    );
  }

  if (!summary) {
    return (
      <View style={styles.container}>
        <Text style={styles.emptyText}>No wallets found</Text>
      </View>
    );
  }

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onRefresh}
      activeOpacity={0.7}
    >
      <Text style={styles.label}>Total Portfolio Value</Text>
      <Text style={styles.totalValue}>
        {formatCurrency(summary.totalValueUSD)}
      </Text>
      
      {summary.change24h !== 0 && (
        <View style={styles.changeContainer}>
          <Text style={[styles.change, { color: getChangeColor(summary.change24h) }]}>
            {formatChange(summary.change24h)}
          </Text>
          <Text style={styles.changePeriod}> (24h)</Text>
          <Text style={[styles.changeValue, { color: getChangeColor(summary.change24h) }]}>
            {' '}${Math.abs(summary.change24hUSD).toFixed(2)}
          </Text>
        </View>
      )}

      <View style={styles.statsRow}>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{summary.wallets.length}</Text>
          <Text style={styles.statLabel}>Wallets</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{summary.assetBreakdown.length}</Text>
          <Text style={styles.statLabel}>Assets</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{summary.topAssets[0]?.symbol || 'N/A'}</Text>
          <Text style={styles.statLabel}>Top Asset</Text>
        </View>
      </View>

      <Text style={styles.lastUpdated}>
        Updated {new Date(summary.lastUpdated).toLocaleTimeString()}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1e1e1e',
    borderRadius: 16,
    padding: 24,
    marginBottom: 16,
    alignItems: 'center',
  },
  label: {
    color: '#999',
    fontSize: 14,
    marginBottom: 8,
  },
  totalValue: {
    color: '#fff',
    fontSize: 48,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  changeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  change: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  changePeriod: {
    color: '#999',
    fontSize: 14,
  },
  changeValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  statsRow: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-around',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  stat: {
    alignItems: 'center',
  },
  statValue: {
    color: '#2196f3',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    color: '#999',
    fontSize: 12,
  },
  lastUpdated: {
    color: '#666',
    fontSize: 11,
    marginTop: 12,
  },
  loadingText: {
    color: '#999',
    fontSize: 16,
    marginTop: 12,
  },
  emptyText: {
    color: '#999',
    fontSize: 16,
  },
});

export default PortfolioHeader;
