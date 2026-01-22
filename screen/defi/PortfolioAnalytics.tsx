// Copyright (C) 2026 MalinWallet Infrastructure - All Rights Reserved
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { PortfolioAnalyticsService } from '../../class/services/defi/portfolio-analytics-service';
import { AllocationChart } from '../../components/charts/AllocationChart';
import { PerformanceCard } from '../../components/defi/PerformanceCard';

interface PortfolioAnalyticsProps {
  navigation: any;
  route: any;
}

const SCREEN_WIDTH = Dimensions.get('window').width;

export const PortfolioAnalytics: React.FC<PortfolioAnalyticsProps> = ({ navigation, route }) => {
  const { wallet, chainId } = route.params || {};

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [performance, setPerformance] = useState<any>(null);
  const [allocation, setAllocation] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [profitLoss, setProfitLoss] = useState<any>(null);

  const analyticsService = PortfolioAnalyticsService.getInstance();

  useEffect(() => {
    loadData();
  }, []);

  /**
   * Load all analytics data
   */
  const loadData = async () => {
    try {
      setLoading(true);

      const address = wallet.getAddress();

      // Auto snapshot
      await analyticsService.autoSnapshot(address, chainId);

      // Load performance
      const perf = await analyticsService.getPortfolioPerformance(address, chainId);
      setPerformance(perf);

      // Load allocation
      const alloc = await analyticsService.getAssetAllocation(address, chainId);
      setAllocation(alloc);

      // Load history (30 days)
      const hist = await analyticsService.getPortfolioHistory(address, chainId, 30);
      setHistory(hist);

      // Calculate P&L
      const snapshots = await (analyticsService as any).getSnapshots(address, chainId);
      const pl = analyticsService.calculateProfitLoss(snapshots);
      setProfitLoss(pl);

    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Refresh data
   */
  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FCD600" />
        <Text style={styles.loadingText}>Loading analytics...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FCD600" />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Portfolio Analytics</Text>
        <Text style={styles.subtitle}>Performance & Insights</Text>
      </View>

      {/* Total Value */}
      {performance && (
        <View style={styles.valueCard}>
          <Text style={styles.valueLabel}>Total Portfolio Value</Text>
          <Text style={styles.valueText}>${performance.totalValue.toFixed(2)}</Text>
          
          <View style={styles.changeRow}>
            <View style={styles.changeItem}>
              <Text style={styles.changeLabel}>24h</Text>
              <Text
                style={[
                  styles.changeValue,
                  { color: performance.totalChangePercent24h >= 0 ? '#4ADE80' : '#FF6B6B' },
                ]}
              >
                {performance.totalChangePercent24h >= 0 ? '+' : ''}
                {performance.totalChangePercent24h.toFixed(2)}%
              </Text>
            </View>

            <View style={styles.changeItem}>
              <Text style={styles.changeLabel}>7d</Text>
              <Text
                style={[
                  styles.changeValue,
                  { color: performance.totalChangePercent7d >= 0 ? '#4ADE80' : '#FF6B6B' },
                ]}
              >
                {performance.totalChangePercent7d >= 0 ? '+' : ''}
                {performance.totalChangePercent7d.toFixed(2)}%
              </Text>
            </View>

            <View style={styles.changeItem}>
              <Text style={styles.changeLabel}>30d</Text>
              <Text
                style={[
                  styles.changeValue,
                  { color: performance.totalChangePercent30d >= 0 ? '#4ADE80' : '#FF6B6B' },
                ]}
              >
                {performance.totalChangePercent30d >= 0 ? '+' : ''}
                {performance.totalChangePercent30d.toFixed(2)}%
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* Performance Cards */}
      {performance && (
        <View style={styles.performanceRow}>
          <PerformanceCard
            title="Best Performer"
            symbol={performance.bestPerformer.symbol}
            change={performance.bestPerformer.changePercent}
            positive={true}
          />
          <PerformanceCard
            title="Worst Performer"
            symbol={performance.worstPerformer.symbol}
            change={performance.worstPerformer.changePercent}
            positive={false}
          />
        </View>
      )}

      {/* Asset Allocation */}
      {allocation.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Asset Allocation</Text>
          <AllocationChart data={allocation} />
          
          <View style={styles.allocationList}>
            {allocation.map((asset, index) => (
              <View key={index} style={styles.allocationItem}>
                <View style={styles.allocationLeft}>
                  <View style={[styles.colorDot, { backgroundColor: asset.color }]} />
                  <Text style={styles.allocationSymbol}>{asset.symbol}</Text>
                </View>
                <View style={styles.allocationRight}>
                  <Text style={styles.allocationPercentage}>
                    {asset.percentage.toFixed(1)}%
                  </Text>
                  <Text style={styles.allocationValue}>
                    ${asset.value.toFixed(2)}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Profit/Loss */}
      {profitLoss && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Profit & Loss</Text>
          
          <View style={styles.plCard}>
            <View style={styles.plRow}>
              <Text style={styles.plLabel}>Total Profit</Text>
              <Text style={[styles.plValue, { color: '#4ADE80' }]}>
                +${profitLoss.totalProfit.toFixed(2)}
              </Text>
            </View>

            <View style={styles.plRow}>
              <Text style={styles.plLabel}>Total Loss</Text>
              <Text style={[styles.plValue, { color: '#FF6B6B' }]}>
                -${profitLoss.totalLoss.toFixed(2)}
              </Text>
            </View>

            <View style={[styles.plRow, styles.plRowTotal]}>
              <Text style={[styles.plLabel, { fontWeight: 'bold' }]}>Net P/L</Text>
              <Text
                style={[
                  styles.plValue,
                  { 
                    fontWeight: 'bold',
                    color: profitLoss.netProfitLoss >= 0 ? '#4ADE80' : '#FF6B6B',
                  },
                ]}
              >
                {profitLoss.netProfitLoss >= 0 ? '+' : ''}
                ${profitLoss.netProfitLoss.toFixed(2)}
              </Text>
            </View>

            <View style={styles.plStats}>
              <View style={styles.plStatItem}>
                <Text style={styles.plStatValue}>{profitLoss.profitableTokens}</Text>
                <Text style={styles.plStatLabel}>Profitable</Text>
              </View>
              <View style={styles.plStatItem}>
                <Text style={styles.plStatValue}>{profitLoss.losingTokens}</Text>
                <Text style={styles.plStatLabel}>Losing</Text>
              </View>
            </View>
          </View>
        </View>
      )}

      {/* Portfolio Value History */}
      {history.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Portfolio Value (30d)</Text>
          
          <View style={styles.historyChart}>
            {history.map((point, index) => {
              const maxValue = Math.max(...history.map(h => h.value));
              const height = (point.value / maxValue) * 100;

              return (
                <View
                  key={index}
                  style={[
                    styles.historyBar,
                    {
                      height: `${height}%`,
                      backgroundColor: point.value >= history[0].value ? '#4ADE80' : '#FF6B6B',
                    },
                  ]}
                />
              );
            })}
          </View>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#212121',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#212121',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
    color: '#AAA',
  },
  header: {
    padding: 20,
    backgroundColor: '#333',
    borderBottomWidth: 1,
    borderBottomColor: '#444',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FCD600',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#AAA',
  },
  valueCard: {
    margin: 16,
    padding: 20,
    backgroundColor: '#2A2A2A',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#444',
  },
  valueLabel: {
    fontSize: 12,
    color: '#AAA',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  valueText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 16,
  },
  changeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  changeItem: {
    flex: 1,
    alignItems: 'center',
  },
  changeLabel: {
    fontSize: 10,
    color: '#AAA',
    marginBottom: 4,
  },
  changeValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  performanceRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 12,
  },
  section: {
    margin: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 16,
  },
  allocationList: {
    marginTop: 16,
  },
  allocationItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  allocationLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  colorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  allocationSymbol: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
  allocationRight: {
    alignItems: 'flex-end',
  },
  allocationPercentage: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FCD600',
  },
  allocationValue: {
    fontSize: 12,
    color: '#AAA',
    marginTop: 2,
  },
  plCard: {
    backgroundColor: '#2A2A2A',
    borderRadius: 12,
    padding: 16,
  },
  plRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  plRowTotal: {
    borderTopWidth: 2,
    borderTopColor: '#444',
    marginTop: 8,
    paddingTop: 16,
  },
  plLabel: {
    fontSize: 14,
    color: '#AAA',
  },
  plValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  plStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  plStatItem: {
    alignItems: 'center',
  },
  plStatValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FCD600',
    marginBottom: 4,
  },
  plStatLabel: {
    fontSize: 12,
    color: '#AAA',
  },
  historyChart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 120,
    backgroundColor: '#2A2A2A',
    borderRadius: 12,
    padding: 8,
  },
  historyBar: {
    flex: 1,
    marginHorizontal: 1,
    borderRadius: 2,
  },
});
