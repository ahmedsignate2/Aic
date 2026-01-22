/**
 * Approval Card Component
 * Display single token approval with revoke option
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { TokenApproval, RiskLevel } from '../../class/services/security/types';

interface ApprovalCardProps {
  approval: TokenApproval;
  onRevoke: (approval: TokenApproval) => void;
  isRevoking?: boolean;
}

export const ApprovalCard: React.FC<ApprovalCardProps> = ({
  approval,
  onRevoke,
  isRevoking = false,
}) => {
  const getRiskColor = () => {
    switch (approval.riskLevel) {
      case RiskLevel.DANGER:
        return '#ff4444';
      case RiskLevel.WARNING:
        return '#ff9800';
      case RiskLevel.SAFE:
        return '#4caf50';
      default:
        return '#999';
    }
  };

  const getRiskEmoji = () => {
    switch (approval.riskLevel) {
      case RiskLevel.DANGER:
        return '🚨';
      case RiskLevel.WARNING:
        return '⚠️';
      case RiskLevel.SAFE:
        return '✅';
      default:
        return '❓';
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.tokenInfo}>
          {approval.tokenLogo && (
            <Image source={{ uri: approval.tokenLogo }} style={styles.logo} />
          )}
          <View style={styles.tokenText}>
            <Text style={styles.tokenSymbol}>{approval.tokenSymbol}</Text>
            <Text style={styles.tokenName}>{approval.tokenName}</Text>
          </View>
        </View>
        <View style={[styles.riskBadge, { backgroundColor: getRiskColor() }]}>
          <Text style={styles.riskEmoji}>{getRiskEmoji()}</Text>
        </View>
      </View>

      <View style={styles.details}>
        <View style={styles.row}>
          <Text style={styles.label}>Spender:</Text>
          <Text style={styles.value} numberOfLines={1}>
            {approval.spenderName}
          </Text>
        </View>
        <Text style={styles.addressText} numberOfLines={1}>
          {approval.spenderAddress}
        </Text>

        <View style={styles.row}>
          <Text style={styles.label}>Allowance:</Text>
          <Text
            style={[
              styles.value,
              approval.allowance === 'unlimited' && styles.unlimitedText,
            ]}
          >
            {approval.allowance === 'unlimited'
              ? '∞ Unlimited'
              : `${parseFloat(approval.allowance).toFixed(4)} ${approval.tokenSymbol}`}
          </Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Type:</Text>
          <Text style={styles.value}>{approval.approvalType}</Text>
        </View>
      </View>

      <TouchableOpacity
        style={[styles.revokeButton, isRevoking && styles.revokeButtonDisabled]}
        onPress={() => onRevoke(approval)}
        disabled={isRevoking}
      >
        <Text style={styles.revokeButtonText}>
          {isRevoking ? '🔄 Revoking...' : '🔓 Revoke Approval'}
        </Text>
      </TouchableOpacity>

      {approval.allowance === 'unlimited' && (
        <Text style={styles.warningText}>
          ⚠️ This contract can spend unlimited tokens from your wallet
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1e1e1e',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#333',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  tokenInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  logo: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  tokenText: {
    flex: 1,
  },
  tokenSymbol: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  tokenName: {
    color: '#999',
    fontSize: 14,
    marginTop: 2,
  },
  riskBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  riskEmoji: {
    fontSize: 16,
  },
  details: {
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
    flex: 1,
    textAlign: 'right',
  },
  unlimitedText: {
    color: '#ff9800',
    fontWeight: 'bold',
  },
  addressText: {
    color: '#666',
    fontSize: 12,
    fontFamily: 'monospace',
    marginBottom: 8,
    marginLeft: 8,
  },
  revokeButton: {
    backgroundColor: '#ff4444',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  revokeButtonDisabled: {
    backgroundColor: '#666',
    opacity: 0.5,
  },
  revokeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  warningText: {
    color: '#ff9800',
    fontSize: 12,
    marginTop: 8,
    textAlign: 'center',
  },
});

export default ApprovalCard;
