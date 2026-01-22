// Copyright (C) 2026 MalinWallet Infrastructure - All Rights Reserved
import React, { useState, useEffect } from 'react';
import { StyleSheet, View, FlatList, Image, TouchableOpacity, Alert } from 'react-native';
import { useTheme } from '../../components/themes';
import SafeArea from '../../components/SafeArea';
import { MalinText } from '../../MalinComponents';
import WalletConnectService from '../../class/services/walletconnect-service';
import { useExtendedNavigation } from '../../hooks/useExtendedNavigation';
import { SessionTypes } from '@walletconnect/types';

const WCSessions: React.FC = () => {
  const { colors } = useTheme();
  const navigation = useExtendedNavigation();
  const [sessions, setSessions] = useState<SessionTypes.Struct[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = () => {
    const activeSessions = WalletConnectService.getActiveSessions();
    setSessions(activeSessions);
  };

  const handleDisconnect = async (topic: string, name: string) => {
    Alert.alert(
      'Disconnect',
      `Are you sure you want to disconnect from ${name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Disconnect',
          style: 'destructive',
          onPress: async () => {
            setIsLoading(true);
            try {
              await WalletConnectService.disconnectSession(topic);
              loadSessions();
              Alert.alert('Success', `Disconnected from ${name}`);
            } catch (error: any) {
              console.error('Failed to disconnect:', error);
              Alert.alert('Error', error.message || 'Failed to disconnect');
            } finally {
              setIsLoading(false);
            }
          },
        },
      ],
    );
  };

  const renderSession = ({ item }: { item: SessionTypes.Struct }) => {
    const { peer, topic, namespaces, expiry } = item;
    const { metadata } = peer;
    const expiryDate = new Date(expiry * 1000);
    const isExpired = expiryDate < new Date();

    // Extract chains
    const chains = Object.keys(namespaces).flatMap((ns) => namespaces[ns].chains || []);

    return (
      <TouchableOpacity
        style={[styles.sessionCard, { backgroundColor: colors.inputBackgroundColor }]}
        onPress={() => handleDisconnect(topic, metadata.name)}
        disabled={isLoading}
      >
        <View style={styles.sessionHeader}>
          {metadata.icons[0] && (
            <Image source={{ uri: metadata.icons[0] }} style={styles.sessionIcon} />
          )}
          <View style={styles.sessionInfo}>
            <MalinText style={[styles.sessionName, { color: colors.foregroundColor }]}>
              {metadata.name}
            </MalinText>
            <MalinText style={[styles.sessionUrl, { color: colors.alternativeTextColor }]}>
              {metadata.url}
            </MalinText>
          </View>
        </View>

        <View style={styles.sessionDetails}>
          <MalinText style={[styles.detailLabel, { color: colors.alternativeTextColor2 }]}>
            Chains:
          </MalinText>
          <MalinText style={[styles.detailValue, { color: colors.alternativeTextColor }]}>
            {chains.join(', ')}
          </MalinText>
        </View>

        <View style={styles.sessionDetails}>
          <MalinText style={[styles.detailLabel, { color: colors.alternativeTextColor2 }]}>
            Expires:
          </MalinText>
          <MalinText style={[styles.detailValue, { color: isExpired ? '#FF3B30' : colors.alternativeTextColor }]}>
            {isExpired ? 'Expired' : expiryDate.toLocaleDateString()}
          </MalinText>
        </View>

        <View style={styles.disconnectButton}>
          <MalinText style={styles.disconnectText}>
            Tap to disconnect
          </MalinText>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeArea style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <MalinText style={[styles.title, { color: colors.foregroundColor }]}>
          Active Connections
        </MalinText>
        <MalinText style={[styles.subtitle, { color: colors.alternativeTextColor }]}>
          Manage your WalletConnect sessions
        </MalinText>
      </View>

      {sessions.length === 0 ? (
        <View style={styles.emptyState}>
          <MalinText style={styles.emptyIcon}>🔗</MalinText>
          <MalinText style={[styles.emptyText, { color: colors.alternativeTextColor }]}>
            No active connections
          </MalinText>
          <MalinText style={[styles.emptySubtext, { color: colors.alternativeTextColor2 }]}>
            Connect to a DApp to see it here
          </MalinText>
        </View>
      ) : (
        <FlatList
          data={sessions}
          renderItem={renderSession}
          keyExtractor={(item) => item.topic}
          contentContainerStyle={styles.list}
          refreshing={isLoading}
          onRefresh={loadSessions}
        />
      )}
    </SafeArea>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingBottom: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
  },
  list: {
    padding: 20,
  },
  sessionCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  sessionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sessionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  sessionInfo: {
    flex: 1,
  },
  sessionName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  sessionUrl: {
    fontSize: 14,
  },
  sessionDetails: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 14,
    marginRight: 8,
    fontWeight: '600',
  },
  detailValue: {
    fontSize: 14,
    flex: 1,
  },
  disconnectButton: {
    marginTop: 8,
    alignItems: 'center',
  },
  disconnectText: {
    fontSize: 14,
    color: '#FF3B30',
    fontWeight: '600',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: 'center',
  },
});

export default WCSessions;
