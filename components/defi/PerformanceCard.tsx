// Copyright (C) 2026 MalinWallet Infrastructure - All Rights Reserved
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface PerformanceCardProps {
  title: string;
  symbol: string;
  change: number;
  positive: boolean;
}

export const PerformanceCard: React.FC<PerformanceCardProps> = ({
  title,
  symbol,
  change,
  positive,
}) => {
  return (
    <View style={[styles.container, positive ? styles.containerPositive : styles.containerNegative]}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.symbol}>{symbol}</Text>
      <Text style={[styles.change, { color: positive ? '#4ADE80' : '#FF6B6B' }]}>
        {positive ? '+' : ''}{change.toFixed(2)}%
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#2A2A2A',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#444',
  },
  containerPositive: {
    borderColor: '#4ADE80',
  },
  containerNegative: {
    borderColor: '#FF6B6B',
  },
  title: {
    fontSize: 10,
    color: '#AAA',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  symbol: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 4,
  },
  change: {
    fontSize: 20,
    fontWeight: 'bold',
  },
});
