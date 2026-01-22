/**
 * Token Approvals Screen
 * View and revoke token approvals
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import ApprovalService from '../../class/services/security/approval-service';
import { TokenApproval, ApprovalType } from '../../class/services/security/types';
import ApprovalCard from '../../components/security/ApprovalCard';
import { CHAIN_CONFIG } from '../../class/services/token/chain-config';

type TokenApprovalsProps = {
  route: RouteProp<any, 'TokenApprovals'>;
  navigation: NativeStackNavigationProp<any, 'TokenApprovals'>;
};

export const TokenApprovals: React.FC<TokenApprovalsProps> = ({ route, navigation }) => {
  const { walletAddress, chainId, privateKey } = route.params as { walletAddress: string; chainId: number; privateKey: string };
  
  const [approvals, setApprovals] = useState<TokenApproval[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [revoking, setRevoking] = useState<string | null>(null);

  const chainConfig = (CHAIN_CONFIG as any).find((c: any) => c.chainId === chainId);

  useEffect(() => {
    loadApprovals();
  }, []);

  const loadApprovals = async () => {
    try {
      setLoading(true);
      if (!chainConfig) {
        throw new Error('Chain not supported');
      }
      
      const result = await ApprovalService.getApprovals(
        walletAddress,
        chainId,
        chainConfig.rpcUrl,
      );
      setApprovals(result);
    } catch (error: any) {
      console.error('Error loading approvals:', error);
      Alert.alert('Error', error.message || 'Failed to load approvals');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await ApprovalService.clearCache(walletAddress, chainId);
    await loadApprovals();
    setRefreshing(false);
  };

  const handleRevoke = async (approval: TokenApproval) => {
    Alert.alert(
      'Revoke Approval',
      `Are you sure you want to revoke ${approval.spenderName}'s approval to spend your ${approval.tokenSymbol}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Revoke',
          style: 'destructive',
          onPress: async () => {
            try {
              setRevoking(approval.id);
              
              if (!chainConfig) {
                throw new Error('Chain not supported');
              }

              let txHash: string;
              if (approval.approvalType === ApprovalType.ERC20) {
                txHash = await ApprovalService.revokeERC20Approval(
                  approval.tokenAddress,
                  approval.spenderAddress,
                  privateKey,
                  chainConfig.rpcUrl,
                );
              } else {
                txHash = await ApprovalService.revokeNFTApproval(
                  approval.tokenAddress,
                  approval.spenderAddress,
                  privateKey,
                  chainConfig.rpcUrl,
                );
              }

              Alert.alert(
                'Success!',
                `Approval revoked successfully!\n\nTransaction: ${txHash.slice(0, 10)}...`,
                [{ text: 'OK', onPress: handleRefresh }],
              );
            } catch (error: any) {
              console.error('Error revoking approval:', error);
              Alert.alert('Error', error.message || 'Failed to revoke approval');
            } finally {
              setRevoking(null);
            }
          },
        },
      ],
    );
  };

  const renderEmpty = () => {
    if (loading) {
      return null;
    }

    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyEmoji}>🔓</Text>
        <Text style={styles.emptyTitle}>No Active Approvals</Text>
        <Text style={styles.emptyText}>
          You haven't granted any token approvals to DApps yet.
        </Text>
        <Text style={styles.emptySubtext}>
          When you interact with DeFi protocols, they may request approval to spend your tokens.
          You can manage them here.
        </Text>
      </View>
    );
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <Text style={styles.title}>🔓 Token Approvals</Text>
      <Text style={styles.subtitle}>
        Manage DApp permissions to spend your tokens
      </Text>
      
      {approvals.length > 0 && (
        <View style={styles.stats}>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{approvals.length}</Text>
            <Text style={styles.statLabel}>Total Approvals</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={[styles.statValue, styles.dangerText]}>
              {approvals.filter(a => a.allowance === 'unlimited').length}
            </Text>
            <Text style={styles.statLabel}>Unlimited</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={[styles.statValue, styles.warningText]}>
              {approvals.filter(a => a.riskLevel === 'warning' || a.riskLevel === 'danger').length}
            </Text>
            <Text style={styles.statLabel}>At Risk</Text>
          </View>
        </View>
      )}

      {approvals.length > 0 && (
        <View style={styles.warningBox}>
          <Text style={styles.warningText}>
            ⚠️ Unlimited approvals allow DApps to spend any amount of your tokens. Revoke approvals
            you no longer need to stay safe!
          </Text>
        </View>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={approvals}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <ApprovalCard
            approval={item}
            onRevoke={handleRevoke}
            isRevoking={revoking === item.id}
          />
        )}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#2196f3" />
        }
      />

      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#2196f3" />
          <Text style={styles.loadingText}>Loading approvals...</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  list: {
    padding: 16,
  },
  header: {
    marginBottom: 24,
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
    marginBottom: 16,
  },
  stats: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#1e1e1e',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  statValue: {
    color: '#2196f3',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    color: '#999',
    fontSize: 12,
  },
  dangerText: {
    color: '#ff4444',
  },
  warningText: {
    color: '#ff9800',
  },
  warningBox: {
    backgroundColor: '#ff980020',
    borderLeftWidth: 3,
    borderLeftColor: '#ff9800',
    padding: 12,
    borderRadius: 8,
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
    marginBottom: 8,
    paddingHorizontal: 32,
  },
  emptySubtext: {
    color: '#666',
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#fff',
    fontSize: 16,
    marginTop: 12,
  },
});

export default TokenApprovals;
