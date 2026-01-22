/**
 * Security Badge Component
 * Display risk indicator for addresses/tokens
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { RiskLevel } from '../../class/services/security/types';

interface SecurityBadgeProps {
  riskLevel: RiskLevel;
  riskScore?: number;
  warnings?: string[];
  onPress?: () => void;
  compact?: boolean;
}

export const SecurityBadge: React.FC<SecurityBadgeProps> = ({
  riskLevel,
  riskScore,
  warnings = [],
  onPress,
  compact = false,
}) => {
  const getBadgeColor = () => {
    switch (riskLevel) {
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

  const getBadgeEmoji = () => {
    switch (riskLevel) {
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

  const getBadgeLabel = () => {
    switch (riskLevel) {
      case RiskLevel.DANGER:
        return 'DANGER';
      case RiskLevel.WARNING:
        return 'WARNING';
      case RiskLevel.SAFE:
        return 'SAFE';
      default:
        return 'UNKNOWN';
    }
  };

  const content = (
    <View style={[styles.badge, { backgroundColor: getBadgeColor() }, compact && styles.badgeCompact]}>
      <Text style={styles.emoji}>{getBadgeEmoji()}</Text>
      {!compact && (
        <>
          <Text style={styles.label}>{getBadgeLabel()}</Text>
          {riskScore !== undefined && (
            <Text style={styles.score}>{riskScore}/100</Text>
          )}
        </>
      )}
    </View>
  );

  if (onPress && warnings.length > 0) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
        {content}
      </TouchableOpacity>
    );
  }

  return content;
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  badgeCompact: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  emoji: {
    fontSize: 16,
  },
  label: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  score: {
    color: '#fff',
    fontSize: 11,
    opacity: 0.8,
  },
});

export default SecurityBadge;
