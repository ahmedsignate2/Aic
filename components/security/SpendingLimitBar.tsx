/**
 * Spending Limit Bar Component
 * Visual progress bar for spending limits
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface SpendingLimitBarProps {
  spent: number;
  limit: number;
  period: string;
}

export const SpendingLimitBar: React.FC<SpendingLimitBarProps> = ({
  spent,
  limit,
  period,
}) => {
  const percentage = Math.min((spent / limit) * 100, 100);
  
  const getColor = () => {
    if (percentage >= 90) return '#ff4444';
    if (percentage >= 75) return '#ff9800';
    return '#4caf50';
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.period}>{period}</Text>
        <Text style={styles.amounts}>
          ${spent.toFixed(2)} / ${limit.toFixed(2)}
        </Text>
      </View>
      
      <View style={styles.barContainer}>
        <View
          style={[
            styles.barFill,
            {
              width: `${percentage}%`,
              backgroundColor: getColor(),
            },
          ]}
        />
      </View>
      
      <Text style={styles.remaining}>
        ${(limit - spent).toFixed(2)} remaining ({(100 - percentage).toFixed(0)}%)
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  period: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  amounts: {
    color: '#999',
    fontSize: 14,
  },
  barContainer: {
    height: 8,
    backgroundColor: '#333',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  barFill: {
    height: '100%',
    borderRadius: 4,
  },
  remaining: {
    color: '#666',
    fontSize: 12,
    textAlign: 'right',
  },
});

export default SpendingLimitBar;
