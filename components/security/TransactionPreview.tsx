/**
 * Transaction Preview Component
 * Show simulation results before sending
 */

import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SimulationResult, BalanceChange } from '../../class/services/security/types';

interface TransactionPreviewProps {
  simulation: SimulationResult;
  nativeSymbol?: string;
}

export const TransactionPreview: React.FC<TransactionPreviewProps> = ({
  simulation,
  nativeSymbol = 'ETH',
}) => {
  const formatChange = (change: string) => {
    const num = parseFloat(change);
    if (num > 0) {
      return `+${num.toFixed(6)}`;
    }
    return num.toFixed(6);
  };

  const getChangeColor = (change: string) => {
    const num = parseFloat(change);
    if (num > 0) return '#4caf50';
    if (num < 0) return '#ff4444';
    return '#999';
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>📋 Transaction Preview</Text>
        <View style={[styles.statusBadge, simulation.success ? styles.successBadge : styles.errorBadge]}>
          <Text style={styles.statusText}>
            {simulation.success ? '✅ Will Succeed' : '❌ Will Fail'}
          </Text>
        </View>
      </View>

      {!simulation.success && simulation.error && (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>❌ {simulation.error}</Text>
        </View>
      )}

      {/* Gas Information */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>⛽ Gas Cost</Text>
        <View style={styles.row}>
          <Text style={styles.label}>Gas Used:</Text>
          <Text style={styles.value}>{simulation.gasUsed}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Gas Price:</Text>
          <Text style={styles.value}>{parseFloat(simulation.gasPrice).toFixed(2)} Gwei</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Total Cost:</Text>
          <Text style={[styles.value, styles.totalCost]}>
            {parseFloat(simulation.totalCost).toFixed(6)} {nativeSymbol}
          </Text>
        </View>
      </View>

      {/* Balance Changes */}
      {simulation.balanceChanges.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>💰 Balance Changes</Text>
          {simulation.balanceChanges.map((change: BalanceChange, index: number) => (
            <View key={index} style={styles.balanceChange}>
              <Text style={styles.addressLabel} numberOfLines={1}>
                {change.address.slice(0, 6)}...{change.address.slice(-4)}
              </Text>
              <View style={styles.balanceRow}>
                <Text style={styles.balanceValue}>
                  {parseFloat(change.before).toFixed(6)} → {parseFloat(change.after).toFixed(6)}
                </Text>
                <Text style={[styles.balanceChange, { color: getChangeColor(change.change) }]}>
                  {formatChange(change.change)} {change.tokenSymbol || nativeSymbol}
                </Text>
              </View>
              {change.usdValue && (
                <Text style={styles.usdValue}>≈ ${change.usdValue}</Text>
              )}
            </View>
          ))}
        </View>
      )}

      {/* Warnings */}
      {simulation.warnings.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>⚠️ Warnings</Text>
          {simulation.warnings.map((warning: string, index: number) => (
            <View key={index} style={styles.warningBox}>
              <Text style={styles.warningText}>{warning}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Events */}
      {simulation.events.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📝 Events</Text>
          {simulation.events.map((event, index) => (
            <View key={index} style={styles.eventBox}>
              <Text style={styles.eventName}>{event.name}</Text>
              <Text style={styles.eventAddress} numberOfLines={1}>
                {event.address}
              </Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1e1e1e',
    borderRadius: 12,
    padding: 16,
    marginVertical: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  successBadge: {
    backgroundColor: '#4caf50',
  },
  errorBadge: {
    backgroundColor: '#ff4444',
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  errorBox: {
    backgroundColor: '#ff444420',
    borderLeftWidth: 3,
    borderLeftColor: '#ff4444',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  errorText: {
    color: '#ff4444',
    fontSize: 14,
  },
  section: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  label: {
    color: '#999',
    fontSize: 14,
  },
  value: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  totalCost: {
    color: '#2196f3',
    fontWeight: 'bold',
  },
  balanceChange: {
    marginBottom: 12,
    padding: 12,
    backgroundColor: '#2a2a2a',
    borderRadius: 8,
  },
  addressLabel: {
    color: '#999',
    fontSize: 12,
    fontFamily: 'monospace',
    marginBottom: 4,
  },
  balanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  balanceValue: {
    color: '#fff',
    fontSize: 13,
  },
  usdValue: {
    color: '#666',
    fontSize: 12,
    marginTop: 4,
  },
  warningBox: {
    backgroundColor: '#ff980020',
    borderLeftWidth: 3,
    borderLeftColor: '#ff9800',
    padding: 10,
    borderRadius: 6,
    marginBottom: 8,
  },
  warningText: {
    color: '#ff9800',
    fontSize: 13,
  },
  eventBox: {
    backgroundColor: '#2a2a2a',
    padding: 10,
    borderRadius: 6,
    marginBottom: 8,
  },
  eventName: {
    color: '#2196f3',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  eventAddress: {
    color: '#666',
    fontSize: 11,
    fontFamily: 'monospace',
  },
});

export default TransactionPreview;
