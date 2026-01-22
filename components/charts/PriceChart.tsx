// Copyright (C) 2026 MalinWallet Infrastructure - All Rights Reserved
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Dimensions } from 'react-native';
import { ChartService, PriceHistory, Timeframe } from '../../class/services/defi/chart-service';

interface PriceChartProps {
  tokenId: string;
  symbol: string;
  currentPrice?: number;
}

const CHART_WIDTH = Dimensions.get('window').width - 32;
const CHART_HEIGHT = 200;

export const PriceChart: React.FC<PriceChartProps> = ({
  tokenId,
  symbol,
  currentPrice,
}) => {
  const [timeframe, setTimeframe] = useState<Timeframe>('7D');
  const [history, setHistory] = useState<PriceHistory | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const chartService = ChartService.getInstance();

  useEffect(() => {
    loadHistory();
  }, [tokenId, timeframe]);

  /**
   * Load price history
   */
  const loadHistory = async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await chartService.getPriceHistory(tokenId, timeframe);
      setHistory(data);
    } catch (err) {
      console.error('Error loading price history:', err);
      setError('Failed to load chart data');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Get chart color based on price change
   */
  const getChartColor = (): string => {
    if (!history || history.prices.length < 2) return '#FCD600';

    const firstPrice = history.prices[0].price;
    const lastPrice = history.prices[history.prices.length - 1].price;

    return lastPrice >= firstPrice ? '#4ADE80' : '#FF6B6B';
  };

  /**
   * Render simple line chart (canvas-based)
   */
  const renderSimpleChart = () => {
    if (!history || history.prices.length === 0) return null;

    const prices = history.prices.map(p => p.price);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const priceRange = maxPrice - minPrice || 1;

    const chartColor = getChartColor();

    return (
      <View style={styles.simpleChartContainer}>
        {history.prices.map((point, index) => {
          const height = ((point.price - minPrice) / priceRange) * (CHART_HEIGHT - 40);
          const width = CHART_WIDTH / history.prices.length;

          return (
            <View
              key={index}
              style={[
                styles.chartBar,
                {
                  width: width - 2,
                  height: height || 2,
                  backgroundColor: chartColor,
                },
              ]}
            />
          );
        })}
      </View>
    );
  };

  /**
   * Render timeframe selector
   */
  const renderTimeframeSelector = () => {
    const timeframes: Timeframe[] = ['1D', '7D', '30D', '90D', '1Y'];

    return (
      <View style={styles.timeframeSelector}>
        {timeframes.map((tf) => (
          <TouchableOpacity
            key={tf}
            style={[
              styles.timeframeButton,
              timeframe === tf && styles.timeframeButtonActive,
            ]}
            onPress={() => setTimeframe(tf)}
          >
            <Text
              style={[
                styles.timeframeButtonText,
                timeframe === tf && styles.timeframeButtonTextActive,
              ]}
            >
              {tf}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  /**
   * Render chart statistics
   */
  const renderStats = () => {
    if (!history) return null;

    const stats = chartService.calculateStats(history.prices);
    const isPositive = stats.changePercent >= 0;

    return (
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Change</Text>
          <Text style={[styles.statValue, { color: isPositive ? '#4ADE80' : '#FF6B6B' }]}>
            {isPositive ? '+' : ''}{stats.changePercent.toFixed(2)}%
          </Text>
        </View>

        <View style={styles.statItem}>
          <Text style={styles.statLabel}>High</Text>
          <Text style={styles.statValue}>${stats.max.toFixed(2)}</Text>
        </View>

        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Low</Text>
          <Text style={styles.statValue}>${stats.min.toFixed(2)}</Text>
        </View>

        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Avg</Text>
          <Text style={styles.statValue}>${stats.average.toFixed(2)}</Text>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#FCD600" />
        <Text style={styles.loadingText}>Loading chart...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadHistory}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!history || history.prices.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>No chart data available</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Current Price */}
      {currentPrice && (
        <View style={styles.priceHeader}>
          <Text style={styles.priceText}>${currentPrice.toFixed(2)}</Text>
          <Text style={styles.symbolText}>{symbol}</Text>
        </View>
      )}

      {/* Simple Chart */}
      {renderSimpleChart()}

      {/* Timeframe Selector */}
      {renderTimeframeSelector()}

      {/* Statistics */}
      {renderStats()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#2A2A2A',
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
  },
  priceHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 16,
  },
  priceText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFF',
    marginRight: 8,
  },
  symbolText: {
    fontSize: 16,
    color: '#AAA',
  },
  simpleChartContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: CHART_HEIGHT,
    marginBottom: 16,
    backgroundColor: '#1A1A1A',
    borderRadius: 8,
    padding: 8,
  },
  chartBar: {
    marginHorizontal: 1,
    borderRadius: 2,
  },
  timeframeSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  timeframeButton: {
    flex: 1,
    padding: 8,
    backgroundColor: '#1A1A1A',
    borderRadius: 8,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  timeframeButtonActive: {
    backgroundColor: '#FCD600',
  },
  timeframeButtonText: {
    fontSize: 12,
    color: '#AAA',
    fontWeight: '600',
  },
  timeframeButtonTextActive: {
    color: '#000',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 10,
    color: '#AAA',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  statValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFF',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
    color: '#AAA',
    textAlign: 'center',
  },
  errorText: {
    fontSize: 14,
    color: '#FF6B6B',
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 16,
    padding: 12,
    backgroundColor: '#FCD600',
    borderRadius: 8,
    alignItems: 'center',
  },
  retryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
  },
});
