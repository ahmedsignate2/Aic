// Copyright (C) 2026 MalinWallet Infrastructure - All Rights Reserved
// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { StyleSheet, View, ScrollView, Alert, Image } from 'react-native';
import { useTheme } from '../../components/themes';
import Button from '../../components/Button';
import SafeArea from '../../components/SafeArea';
import { MalinText } from '../../MalinComponents';
import WalletConnectService from '../../class/services/walletconnect-service';
import { useExtendedNavigation } from '../../hooks/useExtendedNavigation';
import { ProposalTypes } from '@walletconnect/types';

interface WCSessionRequestProps {
  route: {
    params: {
      proposal: ProposalTypes.Struct;
      accounts: string[]; // [ethAddress, solAddress]
    };
  };
}

const WCSessionRequest: React.FC<WCSessionRequestProps> = ({ route }) => {
  const { colors } = useTheme();
  const navigation = useExtendedNavigation();
  const { proposal, accounts } = route.params;
  const [isLoading, setIsLoading] = useState(false);

  const proposalParams = (proposal as any).params || {};
  const { proposer, requiredNamespaces, optionalNamespaces } = proposalParams;
  const dappName = proposer?.metadata?.name || 'Unknown DApp';
  const dappUrl = proposer?.metadata?.url || '';
  const dappIcon = proposer?.metadata?.icons?.[0];
  const dappDescription = proposer?.metadata?.description || '';

  const handleApprove = async () => {
    setIsLoading(true);
    try {
      await WalletConnectService.approveSession(proposal, accounts);
      Alert.alert('Success', `Connected to ${dappName}`);
      navigation.goBack();
    } catch (error: any) {
      console.error('Failed to approve session:', error);
      Alert.alert('Error', error.message || 'Failed to approve connection');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReject = async () => {
    setIsLoading(true);
    try {
      await WalletConnectService.rejectSession(proposal.id, 'User rejected');
      Alert.alert('Rejected', 'Connection request rejected');
      navigation.goBack();
    } catch (error: any) {
      console.error('Failed to reject session:', error);
      Alert.alert('Error', error.message || 'Failed to reject connection');
    } finally {
      setIsLoading(false);
    }
  };

  // Extract chains and methods
  const chains: string[] = [];
  const methods: string[] = [];

  if (requiredNamespaces.eip155) {
    chains.push(...(requiredNamespaces.eip155.chains || []));
    methods.push(...(requiredNamespaces.eip155.methods || []));
  }

  if (requiredNamespaces.solana) {
    chains.push(...(requiredNamespaces.solana.chains || []));
    methods.push(...(requiredNamespaces.solana.methods || []));
  }

  return (
    <SafeArea style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView style={styles.content}>
        <View style={styles.header}>
          {dappIcon && (
            <Image source={{ uri: dappIcon }} style={styles.dappIcon} />
          )}
          <MalinText style={[styles.title, { color: colors.foregroundColor }]}>
            {dappName}
          </MalinText>
          <MalinText style={[styles.url, { color: colors.alternativeTextColor }]}>
            {dappUrl}
          </MalinText>
        </View>

        <View style={[styles.section, { backgroundColor: colors.inputBackgroundColor }]}>
          <MalinText style={[styles.sectionTitle, { color: colors.foregroundColor }]}>
            Description
          </MalinText>
          <MalinText style={[styles.sectionText, { color: colors.alternativeTextColor }]}>
            {dappDescription || 'No description provided'}
          </MalinText>
        </View>

        <View style={[styles.section, { backgroundColor: colors.inputBackgroundColor }]}>
          <MalinText style={[styles.sectionTitle, { color: colors.foregroundColor }]}>
            Chains
          </MalinText>
          {chains.map((chain, index) => (
            <MalinText key={index} style={[styles.item, { color: colors.alternativeTextColor }]}>
              • {chain.replace('eip155:', 'Ethereum Chain ').replace('solana:', 'Solana ')}
            </MalinText>
          ))}
        </View>

        <View style={[styles.section, { backgroundColor: colors.inputBackgroundColor }]}>
          <MalinText style={[styles.sectionTitle, { color: colors.foregroundColor }]}>
            Permissions Requested
          </MalinText>
          {methods.map((method, index) => (
            <MalinText key={index} style={[styles.item, { color: colors.alternativeTextColor }]}>
              • {method}
            </MalinText>
          ))}
        </View>

        <View style={[styles.section, { backgroundColor: colors.inputBackgroundColor }]}>
          <MalinText style={[styles.sectionTitle, { color: colors.foregroundColor }]}>
            Accounts
          </MalinText>
          {accounts.map((account, index) => (
            <MalinText key={index} style={[styles.account, { color: colors.alternativeTextColor }]}>
              {account}
            </MalinText>
          ))}
        </View>

        <View style={[styles.warningBox, { backgroundColor: 'rgba(255, 149, 0, 0.1)' }]}>
          <MalinText style={styles.warningText}>
            ⚠️ Only approve if you trust this application. It will be able to read your wallet addresses and request transaction signatures.
          </MalinText>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Button
          title="Reject"
          onPress={handleReject}
          disabled={isLoading}
          containerStyle={styles.rejectButton}
        />
        <Button
          title="Approve"
          onPress={handleApprove}
          disabled={isLoading}
        />
      </View>
    </SafeArea>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  dappIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  url: {
    fontSize: 14,
  },
  section: {
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  sectionText: {
    fontSize: 14,
    lineHeight: 20,
  },
  item: {
    fontSize: 14,
    marginBottom: 4,
  },
  account: {
    fontSize: 12,
    fontFamily: 'monospace',
    marginBottom: 4,
  },
  warningBox: {
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  warningText: {
    fontSize: 14,
    color: '#FF9500',
    lineHeight: 20,
  },
  footer: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
  },
  rejectButton: {
    flex: 1,
  },
});

export default WCSessionRequest;
