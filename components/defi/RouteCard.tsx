// Copyright (C) 2026 MalinWallet Infrastructure - All Rights Reserved
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SwapRoute } from '../../class/services/defi/swap-aggregator-types';

interface RouteCardProps {
  route: SwapRoute;
  isBest: boolean;
  onSelect: () => void;
  disabled?: boolean;
}

export const RouteCard: React.FC<RouteCardProps> = ({
  route,
  isBest,
  onSelect,
  disabled,
}) => {
  const fromAmount = (parseFloat(route.fromToken.amount) / Math.pow(10, route.fromToken.decimals)).toFixed(6);
  const toAmount = (parseFloat(route.toToken.amount) / Math.pow(10, route.toToken.decimals)).toFixed(6);

  return (
    <TouchableOpacity
      style={[
        styles.container,
        isBest && styles.containerBest,
        disabled && styles.containerDisabled,
      ]}
      onPress={onSelect}
      disabled={disabled}
    >
      {isBest && (
        <View style={styles.bestBadge}>
          <Text style={styles.bestBadgeText}>✓ BEST RATE</Text>
        </View>
      )}

      {/* Aggregator */}
      <View style={styles.header}>
        <Text style={styles.aggregatorText}>
          {route.aggregator === 'oneInch' ? '1inch' : route.aggregator === 'jupiter' ? 'Jupiter' : 'Native'}
        </Text>
        <Text style={styles.timeText}>{route.estimatedTime}s</Text>
      </View>

      {/* Exchange Rate */}
      <View style={styles.rateContainer}>
        <Text style={styles.rateText}>
          {fromAmount} {route.fromToken.symbol} → {toAmount} {route.toToken.symbol}
        </Text>
        <Text style={styles.exchangeRateText}>
          1 {route.fromToken.symbol} = {route.exchangeRate.toFixed(6)} {route.toToken.symbol}
        </Text>
      </View>

      {/* Price Impact & Gas */}
      <View style={styles.detailsRow}>
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>Price Impact</Text>
          <Text
            style={[
              styles.detailValue,
              route.priceImpact > 1 && styles.detailValueWarning,
            ]}
          >
            {route.priceImpact.toFixed(2)}%
          </Text>
        </View>

        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>Gas Fee</Text>
          <Text style={styles.detailValue}>
            {parseFloat(route.gasFee.estimated).toFixed(6)} ETH
          </Text>
        </View>

        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>Slippage</Text>
          <Text style={styles.detailValue}>{route.slippage}%</Text>
        </View>
      </View>

      {/* Route Steps */}
      {route.route.length > 0 && (
        <View style={styles.routeSteps}>
          <Text style={styles.routeStepsTitle}>Route:</Text>
          {route.route.map((step, index) => (
            <Text key={index} style={styles.routeStepText}>
              {index + 1}. {step.protocol} ({step.percentage}%)
            </Text>
          ))}
        </View>
      )}

      {/* Select Button */}
      <TouchableOpacity
        style={[styles.selectButton, isBest && styles.selectButtonBest]}
        onPress={onSelect}
        disabled={disabled}
      >
        <Text style={[styles.selectButtonText, isBest && styles.selectButtonTextBest]}>
          {isBest ? 'Swap with Best Rate' : 'Select This Route'}
        </Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#2A2A2A',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#444',
  },
  containerBest: {
    borderColor: '#FCD600',
    borderWidth: 2,
  },
  containerDisabled: {
    opacity: 0.5,
  },
  bestBadge: {
    position: 'absolute',
    top: -8,
    right: 16,
    backgroundColor: '#FCD600',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  bestBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#000',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  aggregatorText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FCD600',
  },
  timeText: {
    fontSize: 12,
    color: '#AAA',
  },
  rateContainer: {
    marginBottom: 12,
  },
  rateText: {
    fontSize: 16,
    color: '#FFF',
    fontWeight: '600',
    marginBottom: 4,
  },
  exchangeRateText: {
    fontSize: 12,
    color: '#AAA',
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  detailItem: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 10,
    color: '#AAA',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  detailValue: {
    fontSize: 14,
    color: '#FFF',
    fontWeight: '600',
  },
  detailValueWarning: {
    color: '#FF6B6B',
  },
  routeSteps: {
    backgroundColor: '#1A1A1A',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  routeStepsTitle: {
    fontSize: 12,
    color: '#AAA',
    marginBottom: 8,
    fontWeight: '600',
  },
  routeStepText: {
    fontSize: 11,
    color: '#CCC',
    marginBottom: 4,
  },
  selectButton: {
    padding: 12,
    backgroundColor: '#444',
    borderRadius: 8,
    alignItems: 'center',
  },
  selectButtonBest: {
    backgroundColor: '#FCD600',
  },
  selectButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFF',
  },
  selectButtonTextBest: {
    color: '#000',
  },
});
