/**
 * Asset Breakdown Component
 * Pie chart and list of assets
 */

import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { AssetAllocation } from '../../class/services/ux/portfolio-homepage-service';

interface AssetBreakdownProps {
  breakdown: AssetAllocation[];
  loading?: boolean;
}

export const AssetBreakdown: React.FC<AssetBreakdownProps> = ({ breakdown, loading }) => {
  const assets = breakdown || [];
  const colors = ['#2196f3', '#4caf50', '#ff9800', '#9c27b0', '#f44336', '#00bcd4'];

  const renderPieChart = () => {
    if (assets.length === 0) return null;

    return (
      <View style={styles.pieContainer}>
        <View style={styles.pie}>
          {assets.map((asset, index) => {
            const color = colors[index % colors.length];
            const size = Math.max(asset.percentage, 5); // Minimum 5%
            
            return (
              <View
                key={index}
                style={[
                  styles.pieSlice,
                  {
                    backgroundColor: color,
                    width: `${size}%`,
                  },
                ]}
              />
            );
          })}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Asset Breakdown</Text>
      
      {renderPieChart()}

      <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
        {assets.map((asset, index) => {
          const color = colors[index % colors.length];
          
          return (
            <View key={index} style={styles.assetRow}>
              <View style={styles.assetInfo}>
                <View style={[styles.dot, { backgroundColor: color }]} />
                <View style={styles.assetText}>
                  <Text style={styles.assetSymbol}>{asset.symbol}</Text>
                  <Text style={styles.assetChain}>{asset.chain}</Text>
                </View>
              </View>
              <View style={styles.assetValues}>
                <Text style={styles.assetValue}>
                  ${asset.valueUSD.toFixed(2)}
                </Text>
                <Text style={styles.assetPercentage}>
                  {asset.percentage.toFixed(1)}%
                </Text>
              </View>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1e1e1e',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  title: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  pieContainer: {
    marginBottom: 24,
  },
  pie: {
    flexDirection: 'row',
    height: 12,
    borderRadius: 6,
    overflow: 'hidden',
  },
  pieSlice: {
    height: '100%',
  },
  list: {
    maxHeight: 300,
  },
  assetRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  assetInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  assetText: {
    flex: 1,
  },
  assetSymbol: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  assetChain: {
    color: '#999',
    fontSize: 12,
    marginTop: 2,
  },
  assetValues: {
    alignItems: 'flex-end',
  },
  assetValue: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  assetPercentage: {
    color: '#2196f3',
    fontSize: 14,
    marginTop: 2,
  },
});

export default AssetBreakdown;
