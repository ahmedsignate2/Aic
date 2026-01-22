/**
 * Quick Actions Component
 * Common actions: Send, Receive, Swap, Buy
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

interface QuickActionsProps {
  onSend?: () => void;
  onReceive?: () => void;
  onSwap?: () => void;
  onBuy?: () => void;
}

export const QuickActions: React.FC<QuickActionsProps> = ({
  onSend,
  onReceive,
  onSwap,
  onBuy,
}) => {
  const actions = [
    { icon: '📤', label: 'Send', onPress: onSend, color: '#2196f3' },
    { icon: '📥', label: 'Receive', onPress: onReceive, color: '#4caf50' },
    { icon: '🔄', label: 'Swap', onPress: onSwap, color: '#ff9800' },
    { icon: '💳', label: 'Buy', onPress: onBuy, color: '#9c27b0' },
  ];

  return (
    <View style={styles.container}>
      {actions.map((action, index) => (
        <TouchableOpacity
          key={index}
          style={[styles.action, { borderColor: action.color }]}
          onPress={action.onPress}
          activeOpacity={0.7}
        >
          <Text style={styles.icon}>{action.icon}</Text>
          <Text style={styles.label}>{action.label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  action: {
    flex: 1,
    backgroundColor: '#1e1e1e',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 4,
    alignItems: 'center',
    borderWidth: 2,
  },
  icon: {
    fontSize: 32,
    marginBottom: 8,
  },
  label: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default QuickActions;
