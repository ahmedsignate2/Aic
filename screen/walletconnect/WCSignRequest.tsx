// Copyright (C) 2026 MalinWallet Infrastructure - All Rights Reserved
import React, { useState } from 'react';
import { StyleSheet, View, ScrollView, Alert, Image } from 'react-native';
import { useTheme } from '../../components/themes';
import Button from '../../components/Button';
import SafeArea from '../../components/SafeArea';
import { MalinText } from '../../MalinComponents';
import { WalletConnectRequestHandler } from '../../class/services/walletconnect-request-handler';
import { useExtendedNavigation } from '../../hooks/useExtendedNavigation';
import { SignClientTypes } from '@walletconnect/types';
import { ethers } from 'ethers';

interface WCSignRequestProps {
  route: {
    params: {
      request: SignClientTypes.EventArguments['session_request'];
      sessionName: string;
      sessionIcon?: string;
      wallet: any; // EthereumWallet or SolanaWallet
    };
  };
}

const WCSignRequest: React.FC<WCSignRequestProps> = ({ route }) => {
  const { colors } = useTheme();
  const navigation = useExtendedNavigation();
  const { request, sessionName, sessionIcon, wallet } = route.params;
  const [isLoading, setIsLoading] = useState(false);

  const { topic, params } = request;
  const { request: req, chainId } = params;
  const { method, params: methodParams } = req;
  const requestId = (req as any).id || Date.now(); // Fallback ID

  const handleApprove = async () => {
    setIsLoading(true);
    try {
      let result;

      if (chainId.startsWith('eip155:')) {
        // Ethereum request
        result = await WalletConnectRequestHandler.handleEthereumRequest(request, wallet);
      } else if (chainId.startsWith('solana:')) {
        // Solana request
        result = await WalletConnectRequestHandler.handleSolanaRequest(request, wallet);
      } else {
        throw new Error(`Unsupported chain: ${chainId}`);
      }

      await WalletConnectRequestHandler.approveRequest(topic, requestId, result);
      Alert.alert('Success', 'Transaction signed successfully');
      navigation.goBack();
    } catch (error: any) {
      console.error('Failed to sign:', error);
      Alert.alert('Error', error.message || 'Failed to sign transaction');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReject = async () => {
    setIsLoading(true);
    try {
      await WalletConnectRequestHandler.rejectRequest(topic, requestId, 'User rejected');
      Alert.alert('Rejected', 'Request rejected');
      navigation.goBack();
    } catch (error: any) {
      console.error('Failed to reject:', error);
      Alert.alert('Error', error.message || 'Failed to reject request');
    } finally {
      setIsLoading(false);
    }
  };

  // Format transaction details for display
  const formatTransactionDetails = () => {
    switch (method) {
      case 'eth_sendTransaction':
        const tx = methodParams[0];
        return {
          type: 'Send Transaction',
          details: [
            { label: 'To', value: tx.to || 'Contract Creation' },
            { label: 'Value', value: tx.value ? ethers.formatEther(tx.value) + ' ETH' : '0 ETH' },
            { label: 'Gas Limit', value: tx.gas || 'Auto' },
            { label: 'Data', value: tx.data || '0x' },
          ],
        };

      case 'personal_sign':
        return {
          type: 'Sign Message',
          details: [
            { label: 'Message', value: methodParams[0] },
            { label: 'Address', value: methodParams[1] },
          ],
        };

      case 'eth_signTypedData':
      case 'eth_signTypedData_v4':
        const typedData = typeof methodParams[1] === 'string' ? JSON.parse(methodParams[1]) : methodParams[1];
        return {
          type: 'Sign Typed Data',
          details: [
            { label: 'Domain', value: typedData.domain?.name || 'Unknown' },
            { label: 'Message', value: JSON.stringify(typedData.message, null, 2) },
          ],
        };

      // Solana methods
      case 'solana_signTransaction':
        return {
          type: 'Sign Solana Transaction',
          details: [
            { label: 'Transaction', value: methodParams.message?.substring(0, 100) + '...' || 'View in DApp' },
            { label: 'Chain', value: 'Solana' },
          ],
        };

      case 'solana_signMessage':
        return {
          type: 'Sign Solana Message',
          details: [
            { label: 'Message', value: methodParams.message || methodParams[0] },
            { label: 'Display', value: methodParams.display || 'utf8' },
          ],
        };

      case 'solana_signAndSendTransaction':
        return {
          type: 'Sign & Send Solana Transaction',
          details: [
            { label: 'Transaction', value: methodParams.message?.substring(0, 100) + '...' || 'View in DApp' },
            { label: 'Chain', value: 'Solana' },
            { label: 'Action', value: 'Will be broadcasted immediately' },
          ],
        };

      default:
        return {
          type: method,
          details: [
            { label: 'Params', value: JSON.stringify(methodParams, null, 2) },
          ],
        };
    }
  };

  const { type, details } = formatTransactionDetails();

  return (
    <SafeArea style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView style={styles.content}>
        <View style={styles.header}>
          {sessionIcon && (
            <Image source={{ uri: sessionIcon }} style={styles.dappIcon} />
          )}
          <MalinText style={[styles.title, { color: colors.foregroundColor }]}>
            {sessionName}
          </MalinText>
          <MalinText style={[styles.requestType, { color: colors.alternativeTextColor }]}>
            {type}
          </MalinText>
        </View>

        <View style={[styles.section, { backgroundColor: colors.inputBackgroundColor }]}>
          <MalinText style={[styles.sectionTitle, { color: colors.foregroundColor }]}>
            Chain
          </MalinText>
          <MalinText style={[styles.sectionText, { color: colors.alternativeTextColor }]}>
            {chainId}
          </MalinText>
        </View>

        {details.map((detail, index) => (
          <View key={index} style={[styles.section, { backgroundColor: colors.inputBackgroundColor }]}>
            <MalinText style={[styles.sectionTitle, { color: colors.foregroundColor }]}>
              {detail.label}
            </MalinText>
            <MalinText style={[styles.sectionText, { color: colors.alternativeTextColor }]}>
              {detail.value}
            </MalinText>
          </View>
        ))}

        <View style={[styles.warningBox, { backgroundColor: 'rgba(255, 59, 48, 0.1)' }]}>
          <MalinText style={styles.warningText}>
            ⚠️ Only approve if you initiated this action. Signing malicious requests can result in loss of funds.
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
    width: 60,
    height: 60,
    borderRadius: 30,
    marginBottom: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  requestType: {
    fontSize: 16,
    fontWeight: '600',
  },
  section: {
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  sectionText: {
    fontSize: 14,
    lineHeight: 20,
    fontFamily: 'monospace',
  },
  warningBox: {
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  warningText: {
    fontSize: 14,
    color: '#FF3B30',
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

export default WCSignRequest;
