// Copyright (C) 2026 MalinWallet Infrastructure - All Rights Reserved
import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  TextInput,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { TokenService, ChainId, CustomToken, getChainConfig } from '../../class/services/token';
import { MalinText } from '../../MalinComponents';
import { useTheme } from '../../components/themes';
import { useExtendedNavigation } from '../../hooks/useExtendedNavigation';
import SafeArea from '../../components/SafeArea';
import Button from '../../components/Button';

interface AddTokenProps {
  route: {
    params: {
      address: string;
      chainId: ChainId;
    };
  };
}

const AddToken: React.FC<AddTokenProps> = ({ route }) => {
  const { address, chainId } = route.params;
  const { colors } = useTheme();
  const navigation = useExtendedNavigation();

  const [contractAddress, setContractAddress] = useState('');
  const [validating, setValidating] = useState(false);
  const [adding, setAdding] = useState(false);
  const [tokenPreview, setTokenPreview] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const chain = getChainConfig(chainId);

  const handleValidate = async () => {
    if (!contractAddress || contractAddress.trim().length === 0) {
      setError('Please enter a token contract address');
      return;
    }

    setValidating(true);
    setError(null);
    setTokenPreview(null);

    try {
      const isValid = await TokenService.validateTokenAddress(contractAddress.trim(), chainId);
      
      if (!isValid) {
        setError('Invalid token address or token not found');
        return;
      }

      // Fetch token metadata for preview
      const customToken: CustomToken = {
        address: contractAddress.trim(),
        chainId,
      };

      const token = await TokenService.addCustomToken(customToken);
      
      if (!token) {
        setError('Failed to fetch token details');
        return;
      }

      setTokenPreview(token);
    } catch (err: any) {
      console.error('Error validating token:', err);
      setError(err.message || 'Failed to validate token');
    } finally {
      setValidating(false);
    }
  };

  const handleAddToken = async () => {
    if (!tokenPreview) return;

    setAdding(true);

    try {
      Alert.alert(
        'Token Added',
        `${tokenPreview.name} (${tokenPreview.symbol}) has been added to your wallet.`,
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (err: any) {
      console.error('Error adding token:', err);
      Alert.alert('Error', err.message || 'Failed to add token');
    } finally {
      setAdding(false);
    }
  };

  return (
    <SafeArea style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.content}>
          {/* Header */}
          <MalinText style={[styles.title, { color: colors.foregroundColor }]}>
            Add Custom Token
          </MalinText>
          <MalinText style={[styles.subtitle, { color: colors.alternativeTextColor }]}>
            Add any ERC-20 token on {chain.name}
          </MalinText>

          {/* Contract Address Input */}
          <View style={[styles.section, { backgroundColor: colors.inputBackgroundColor }]}>
            <MalinText style={[styles.label, { color: colors.foregroundColor }]}>
              Token Contract Address
            </MalinText>
            <TextInput
              style={[
                styles.input,
                {
                  color: colors.foregroundColor,
                  borderColor: colors.formBorder,
                },
              ]}
              value={contractAddress}
              onChangeText={(text) => {
                setContractAddress(text);
                setError(null);
                setTokenPreview(null);
              }}
              placeholder="0x..."
              placeholderTextColor={colors.alternativeTextColor2}
              autoCapitalize="none"
              autoCorrect={false}
            />
            {error && (
              <MalinText style={styles.error}>{error}</MalinText>
            )}
          </View>

          {/* Validate Button */}
          {!tokenPreview && (
            <Button
              title={validating ? 'Validating...' : 'Validate Token'}
              onPress={handleValidate}
              disabled={validating || !contractAddress}
            />
          )}

          {/* Token Preview */}
          {tokenPreview && (
            <View style={[styles.preview, { backgroundColor: colors.inputBackgroundColor }]}>
              <MalinText style={[styles.previewTitle, { color: colors.foregroundColor }]}>
                Token Details
              </MalinText>
              
              <View style={styles.previewRow}>
                <MalinText style={[styles.previewLabel, { color: colors.alternativeTextColor }]}>
                  Name
                </MalinText>
                <MalinText style={[styles.previewValue, { color: colors.foregroundColor }]}>
                  {tokenPreview.name}
                </MalinText>
              </View>

              <View style={styles.previewRow}>
                <MalinText style={[styles.previewLabel, { color: colors.alternativeTextColor }]}>
                  Symbol
                </MalinText>
                <MalinText style={[styles.previewValue, { color: colors.foregroundColor }]}>
                  {tokenPreview.symbol}
                </MalinText>
              </View>

              <View style={styles.previewRow}>
                <MalinText style={[styles.previewLabel, { color: colors.alternativeTextColor }]}>
                  Decimals
                </MalinText>
                <MalinText style={[styles.previewValue, { color: colors.foregroundColor }]}>
                  {tokenPreview.decimals}
                </MalinText>
              </View>

              <View style={styles.previewRow}>
                <MalinText style={[styles.previewLabel, { color: colors.alternativeTextColor }]}>
                  Chain
                </MalinText>
                <MalinText style={[styles.previewValue, { color: colors.foregroundColor }]}>
                  {chain.name}
                </MalinText>
              </View>
            </View>
          )}

          {/* Add Button */}
          {tokenPreview && (
            <Button
              title={adding ? 'Adding...' : 'Add Token'}
              onPress={handleAddToken}
              disabled={adding}
            />
          )}

          {/* Warning */}
          <View style={[styles.warning, { backgroundColor: colors.redBG }]}>
            <MalinText style={[styles.warningText, { color: colors.redText }]}>
              ⚠️ Warning: Anyone can create a token with any name. Verify the contract address
              before adding to avoid scams.
            </MalinText>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeArea>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 24,
  },
  section: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    fontFamily: 'monospace',
  },
  error: {
    color: '#ef4444',
    fontSize: 12,
    marginTop: 8,
  },
  preview: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  previewTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  previewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  previewLabel: {
    fontSize: 14,
  },
  previewValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  warning: {
    padding: 16,
    borderRadius: 12,
    marginTop: 20,
  },
  warningText: {
    fontSize: 13,
    lineHeight: 18,
  },
});

export default AddToken;
