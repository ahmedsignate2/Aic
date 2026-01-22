/**
 * Address Whitelist Screen
 * Manage trusted addresses
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
} from 'react-native';
import { RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ethers } from 'ethers';
import WhitelistService from '../../class/services/security/whitelist-service';
import { WhitelistEntry } from '../../class/services/security/types';

type AddressWhitelistProps = {
  route: RouteProp<any, 'AddressWhitelist'>;
  navigation: NativeStackNavigationProp<any, 'AddressWhitelist'>;
};

export const AddressWhitelist: React.FC<AddressWhitelistProps> = ({ route, navigation }) => {
  const { walletId } = route.params as { walletId: string };
  
  const [whitelist, setWhitelist] = useState<WhitelistEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  
  // Add form state
  const [newAddress, setNewAddress] = useState('');
  const [newLabel, setNewLabel] = useState('');
  const [newNote, setNewNote] = useState('');

  useEffect(() => {
    loadWhitelist();
  }, []);

  const loadWhitelist = async () => {
    try {
      setLoading(true);
      const result = await WhitelistService.getWhitelist(walletId);
      setWhitelist(result);
    } catch (error) {
      console.error('Error loading whitelist:', error);
      Alert.alert('Error', 'Failed to load whitelist');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    if (!newAddress.trim()) {
      Alert.alert('Error', 'Please enter an address');
      return;
    }

    if (!newLabel.trim()) {
      Alert.alert('Error', 'Please enter a label');
      return;
    }

    // Validate address
    if (!ethers.isAddress(newAddress)) {
      Alert.alert('Error', 'Invalid Ethereum address');
      return;
    }

    try {
      await WhitelistService.addAddress(
        walletId,
        newAddress,
        newLabel,
        newNote || undefined,
      );
      
      // Reset form
      setNewAddress('');
      setNewLabel('');
      setNewNote('');
      setShowAddModal(false);
      
      // Reload
      await loadWhitelist();
      
      Alert.alert('Success', 'Address added to whitelist');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to add address');
    }
  };

  const handleRemove = (entry: WhitelistEntry) => {
    Alert.alert(
      'Remove Address',
      `Remove "${entry.label}" from whitelist?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await WhitelistService.removeAddress(walletId, entry.id);
              await loadWhitelist();
            } catch (error) {
              Alert.alert('Error', 'Failed to remove address');
            }
          },
        },
      ],
    );
  };

  const renderEntry = ({ item }: { item: WhitelistEntry }) => (
    <View style={styles.entryCard}>
      <View style={styles.entryHeader}>
        <View style={styles.entryInfo}>
          <Text style={styles.entryLabel}>✅ {item.label}</Text>
          <Text style={styles.entryAddress} numberOfLines={1}>
            {item.address}
          </Text>
          {item.note && (
            <Text style={styles.entryNote}>{item.note}</Text>
          )}
          <Text style={styles.entryDate}>
            Added {new Date(item.addedAt).toLocaleDateString()}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.removeButton}
          onPress={() => handleRemove(item)}
        >
          <Text style={styles.removeButtonText}>🗑️</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyEmoji}>✅</Text>
      <Text style={styles.emptyTitle}>No Trusted Addresses</Text>
      <Text style={styles.emptyText}>
        Add addresses you frequently send to for faster transactions.
      </Text>
      <TouchableOpacity
        style={styles.addFirstButton}
        onPress={() => setShowAddModal(true)}
      >
        <Text style={styles.addFirstButtonText}>+ Add First Address</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>✅ Trusted Addresses</Text>
        <Text style={styles.subtitle}>
          Manage your whitelist of trusted addresses
        </Text>
      </View>

      <FlatList
        data={whitelist}
        keyExtractor={item => item.id}
        renderItem={renderEntry}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={styles.list}
      />

      {whitelist.length > 0 && (
        <TouchableOpacity
          style={styles.fab}
          onPress={() => setShowAddModal(true)}
        >
          <Text style={styles.fabText}>+</Text>
        </TouchableOpacity>
      )}

      {/* Add Address Modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Trusted Address</Text>

            <Text style={styles.inputLabel}>Address *</Text>
            <TextInput
              style={styles.input}
              value={newAddress}
              onChangeText={setNewAddress}
              placeholder="0x..."
              placeholderTextColor="#666"
              autoCapitalize="none"
              autoCorrect={false}
            />

            <Text style={styles.inputLabel}>Label *</Text>
            <TextInput
              style={styles.input}
              value={newLabel}
              onChangeText={setNewLabel}
              placeholder="e.g., Mom's Wallet"
              placeholderTextColor="#666"
            />

            <Text style={styles.inputLabel}>Note (Optional)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={newNote}
              onChangeText={setNewNote}
              placeholder="Additional notes..."
              placeholderTextColor="#666"
              multiline
              numberOfLines={3}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowAddModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.addButton]}
                onPress={handleAdd}
              >
                <Text style={styles.addButtonText}>Add</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
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
  list: {
    padding: 16,
  },
  entryCard: {
    backgroundColor: '#1e1e1e',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#4caf50',
  },
  entryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  entryInfo: {
    flex: 1,
  },
  entryLabel: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  entryAddress: {
    color: '#999',
    fontSize: 14,
    fontFamily: 'monospace',
    marginBottom: 4,
  },
  entryNote: {
    color: '#666',
    fontSize: 14,
    marginBottom: 4,
    fontStyle: 'italic',
  },
  entryDate: {
    color: '#666',
    fontSize: 12,
  },
  removeButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeButtonText: {
    fontSize: 24,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  emptyText: {
    color: '#999',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 32,
  },
  addFirstButton: {
    backgroundColor: '#2196f3',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  addFirstButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#2196f3',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  fabText: {
    color: '#fff',
    fontSize: 32,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#1e1e1e',
    borderRadius: 16,
    padding: 24,
  },
  modalTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 24,
  },
  inputLabel: {
    color: '#999',
    fontSize: 14,
    marginBottom: 8,
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
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  modalButton: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#333',
  },
  addButton: {
    backgroundColor: '#2196f3',
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default AddressWhitelist;
