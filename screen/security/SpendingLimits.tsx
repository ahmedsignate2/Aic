/**
 * Spending Limits Screen
 * Configure transaction spending limits
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Switch,
  Alert,
} from 'react-native';
import { RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import SpendingLimitsService from '../../class/services/security/spending-limits-service';
import { SpendingLimit, LimitPeriod, SpendingRecord } from '../../class/services/security/types';
import SpendingLimitBar from '../../components/security/SpendingLimitBar';

type SpendingLimitsProps = {
  route: RouteProp<any, 'SpendingLimits'>;
  navigation: NativeStackNavigationProp<any, 'SpendingLimits'>;
};

export const SpendingLimits: React.FC<SpendingLimitsProps> = ({ route, navigation }) => {
  const { walletId } = route.params as { walletId: string };
  
  const [limits, setLimits] = useState<SpendingLimit[]>([]);
  const [records, setRecords] = useState<Record<LimitPeriod, SpendingRecord>>({} as any);
  const [loading, setLoading] = useState(true);
  
  // Edit state
  const [editingPeriod, setEditingPeriod] = useState<LimitPeriod | null>(null);
  const [editAmount, setEditAmount] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load limits
      const allLimits = await SpendingLimitsService.getAllLimits(walletId);
      setLimits(allLimits);
      
      // Load spending records
      const periods = [LimitPeriod.DAILY, LimitPeriod.WEEKLY, LimitPeriod.MONTHLY];
      const recordsData: Record<LimitPeriod, SpendingRecord> = {} as any;
      
      for (const period of periods) {
        recordsData[period] = await SpendingLimitsService.getRecord(walletId, period);
      }
      
      setRecords(recordsData);
    } catch (error) {
      console.error('Error loading data:', error);
      Alert.alert('Error', 'Failed to load spending limits');
    } finally {
      setLoading(false);
    }
  };

  const getLimit = (period: LimitPeriod): SpendingLimit | null => {
    return limits.find(l => l.period === period) || null;
  };

  const handleToggle = async (period: LimitPeriod, enabled: boolean) => {
    try {
      await SpendingLimitsService.toggleLimit(walletId, period, enabled);
      await loadData();
    } catch (error) {
      Alert.alert('Error', 'Failed to update limit');
    }
  };

  const handleSetLimit = async (period: LimitPeriod) => {
    const amount = parseFloat(editAmount);
    
    if (isNaN(amount) || amount <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    try {
      await SpendingLimitsService.setLimit(walletId, period, amount, false);
      setEditingPeriod(null);
      setEditAmount('');
      await loadData();
      Alert.alert('Success', 'Spending limit updated');
    } catch (error) {
      Alert.alert('Error', 'Failed to set limit');
    }
  };

  const handleRemoveLimit = async (period: LimitPeriod) => {
    Alert.alert(
      'Remove Limit',
      `Remove ${period} spending limit?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await SpendingLimitsService.removeLimit(walletId, period);
              await loadData();
            } catch (error) {
              Alert.alert('Error', 'Failed to remove limit');
            }
          },
        },
      ],
    );
  };

  const renderLimitCard = (period: LimitPeriod, label: string, description: string) => {
    const limit = getLimit(period);
    const record = records[period];
    const isEditing = editingPeriod === period;

    return (
      <View style={styles.card} key={period}>
        <View style={styles.cardHeader}>
          <View style={styles.cardTitle}>
            <Text style={styles.cardLabel}>{label}</Text>
            <Text style={styles.cardDescription}>{description}</Text>
          </View>
          {limit && (
            <Switch
              value={limit.enabled}
              onValueChange={(val) => handleToggle(period, val)}
              trackColor={{ false: '#333', true: '#2196f3' }}
              thumbColor={limit.enabled ? '#fff' : '#999'}
            />
          )}
        </View>

        {limit ? (
          <>
            {limit.enabled && record && (
              <SpendingLimitBar
                spent={record.spentUSD}
                limit={limit.limitUSD}
                period={label}
              />
            )}
            
            {isEditing ? (
              <View style={styles.editForm}>
                <TextInput
                  style={styles.input}
                  value={editAmount}
                  onChangeText={setEditAmount}
                  placeholder="Enter amount in USD"
                  placeholderTextColor="#666"
                  keyboardType="decimal-pad"
                  autoFocus
                />
                <View style={styles.editButtons}>
                  <TouchableOpacity
                    style={[styles.button, styles.cancelButton]}
                    onPress={() => {
                      setEditingPeriod(null);
                      setEditAmount('');
                    }}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.button, styles.saveButton]}
                    onPress={() => handleSetLimit(period)}
                  >
                    <Text style={styles.saveButtonText}>Save</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <View style={styles.actions}>
                <TouchableOpacity
                  style={[styles.button, styles.editButton]}
                  onPress={() => {
                    setEditingPeriod(period);
                    setEditAmount(limit.limitUSD.toString());
                  }}
                >
                  <Text style={styles.editButtonText}>✏️ Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.button, styles.removeButton]}
                  onPress={() => handleRemoveLimit(period)}
                >
                  <Text style={styles.removeButtonText}>🗑️ Remove</Text>
                </TouchableOpacity>
              </View>
            )}
          </>
        ) : (
          <TouchableOpacity
            style={[styles.button, styles.addButton]}
            onPress={() => {
              setEditingPeriod(period);
              setEditAmount('');
            }}
          >
            <Text style={styles.addButtonText}>+ Set Limit</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>💸 Spending Limits</Text>
        <Text style={styles.subtitle}>
          Set maximum amounts for transactions
        </Text>
      </View>

      <View style={styles.infoBox}>
        <Text style={styles.infoText}>
          ℹ️ Spending limits help you control how much you spend over different time periods.
          Transactions exceeding these limits will require additional confirmation.
        </Text>
      </View>

      {renderLimitCard(
        LimitPeriod.PER_TRANSACTION,
        'Per Transaction',
        'Maximum amount per single transaction'
      )}

      {renderLimitCard(
        LimitPeriod.DAILY,
        'Daily Limit',
        'Maximum spending per day'
      )}

      {renderLimitCard(
        LimitPeriod.WEEKLY,
        'Weekly Limit',
        'Maximum spending per week'
      )}

      {renderLimitCard(
        LimitPeriod.MONTHLY,
        'Monthly Limit',
        'Maximum spending per month'
      )}

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          💡 Tip: Start with conservative limits and adjust as needed. You can always override
          limits for important transactions.
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  content: {
    padding: 16,
  },
  header: {
    marginBottom: 16,
  },
  title: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    color: '#999',
    fontSize: 16,
  },
  infoBox: {
    backgroundColor: '#2196f320',
    borderLeftWidth: 3,
    borderLeftColor: '#2196f3',
    padding: 12,
    borderRadius: 8,
    marginBottom: 24,
  },
  infoText: {
    color: '#2196f3',
    fontSize: 14,
    lineHeight: 20,
  },
  card: {
    backgroundColor: '#1e1e1e',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#333',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    flex: 1,
  },
  cardLabel: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  cardDescription: {
    color: '#999',
    fontSize: 14,
  },
  editForm: {
    marginTop: 12,
  },
  input: {
    backgroundColor: '#2a2a2a',
    borderRadius: 8,
    padding: 12,
    color: '#fff',
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#333',
    marginBottom: 12,
  },
  editButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  button: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  addButton: {
    backgroundColor: '#2196f3',
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  editButton: {
    backgroundColor: '#333',
  },
  editButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  removeButton: {
    backgroundColor: '#ff4444',
  },
  removeButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  cancelButton: {
    backgroundColor: '#333',
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  saveButton: {
    backgroundColor: '#4caf50',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  footer: {
    marginTop: 24,
    padding: 16,
    backgroundColor: '#1e1e1e',
    borderRadius: 12,
  },
  footerText: {
    color: '#999',
    fontSize: 14,
    lineHeight: 20,
  },
});

export default SpendingLimits;
