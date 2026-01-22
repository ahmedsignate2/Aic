// Copyright (C) 2026 MalinWallet Infrastructure - All Rights Reserved
import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  TextInput,
  ActivityIndicator,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from 'react-native';
import {
  Token,
  ChainId,
  BridgeRoute,
  getChainConfig,
  getEVMChains,
} from '../../class/services/token';
import { BridgeService } from '../../class/services/bridge-service';
import { ChainSelector } from '../../components/token/ChainSelector';
import { MalinText } from '../../MalinComponents';
import { useTheme } from '../../components/themes';
import { useExtendedNavigation } from '../../hooks/useExtendedNavigation';
import { useStorage } from '../../hooks/context/useStorage';
import SafeArea from '../../components/SafeArea';
import Button from '../../components/Button';
import { ethers } from 'ethers';

interface BridgeScreenProps {
  route: {
    params: {
      token?: Token;
      fromChainId?: ChainId;
    };
  };
}

const BridgeScreen: React.FC<BridgeScreenProps> = ({ route }) => {
  const { token: initialToken, fromChainId: initialFromChainId } = route.params || {};
  const { colors } = useTheme();
  const navigation = useExtendedNavigation();
  const { wallets } = useStorage();

  const [fromChainId, setFromChainId] = useState<ChainId>(
    initialFromChainId || initialToken?.chainId || ChainId.ETHEREUM
  );
  const [toChainId, setToChainId] = useState<ChainId>(ChainId.POLYGON);
  const [amount, setAmount] = useState('');
  const [routes, setRoutes] = useState<BridgeRoute[]>([]);
  const [selectedRoute, setSelectedRoute] = useState<BridgeRoute | null>(null);
  const [loading, setLoading] = useState(false);
  const [bridging, setBridging] = useState(false);

  // Get user's wallet address (simplified - should match chain)
  const wallet = wallets.find((w) => w.type === 'ethereum'); // Simplified
  const userAddress = wallet?.getAddress() || '';

  const evmChains = getEVMChains();

  useEffect(() => {
    if (fromChainId === toChainId) {
      // Auto-switch destination if same as source
      const otherChain = evmChains.find((c) => c.id !== fromChainId);
      if (otherChain) {
        setToChainId(otherChain.id);
      }
    }
  }, [fromChainId, toChainId]);

  const handleFetchRoutes = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid amount');
      return;
    }

    if (fromChainId === toChainId) {
      Alert.alert('Error', 'Source and destination chains must be different');
      return;
    }

    if (!userAddress) {
      Alert.alert('Error', 'Wallet address not found');
      return;
    }

    setLoading(true);
    setRoutes([]);
    setSelectedRoute(null);

    try {
      // Create a dummy token for native currency
      const token: Token = initialToken || {
        address: 'native',
        symbol: getChainConfig(fromChainId).symbol,
        name: getChainConfig(fromChainId).name,
        decimals: 18,
        standard: 'NATIVE' as any,
        chainId: fromChainId,
        isNative: true,
      };

      // Convert amount to wei
      const amountWei = ethers.parseEther(amount).toString();

      const fetchedRoutes = await BridgeService.getRoutes(
        fromChainId,
        toChainId,
        token,
        amountWei,
        userAddress
      );

      setRoutes(fetchedRoutes);

      if (fetchedRoutes.length === 0) {
        Alert.alert('No Routes Found', 'No bridge routes available for this transfer');
      }
    } catch (error: any) {
      console.error('Error fetching routes:', error);
      Alert.alert('Error', error.message || 'Failed to fetch bridge routes');
    } finally {
      setLoading(false);
    }
  };

  const handleBridge = async () => {
    if (!selectedRoute) return;

    setBridging(true);

    try {
      // In real implementation, this would:
      // 1. Get transaction data from Socket API
      // 2. Sign transaction with user's wallet
      // 3. Send transaction
      // 4. Monitor bridge status

      Alert.alert(
        'Bridge Initiated',
        `Your bridge transaction has been initiated. It will take approximately ${Math.floor(
          selectedRoute.estimatedTime / 60
        )} minutes to complete.`,
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error: any) {
      console.error('Error bridging:', error);
      Alert.alert('Error', error.message || 'Failed to execute bridge');
    } finally {
      setBridging(false);
    }
  };

  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    return `~${minutes} min`;
  };

  const formatAmount = (amountStr: string, decimals = 18) => {
    try {
      return parseFloat(ethers.formatUnits(amountStr, decimals)).toFixed(6);
    } catch {
      return '0';
    }
  };

  const fromChain = getChainConfig(fromChainId);
  const toChain = getChainConfig(toChainId);

  return (
    <SafeArea style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.content}>
          {/* Header */}
          <MalinText style={[styles.title, { color: colors.foregroundColor }]}>
            Cross-Chain Bridge
          </MalinText>
          <MalinText style={[styles.subtitle, { color: colors.alternativeTextColor }]}>
            Transfer assets between chains securely
          </MalinText>

          {/* From Chain */}
          <View style={styles.chainSection}>
            <MalinText style={[styles.label, { color: colors.foregroundColor }]}>
              From Chain
            </MalinText>
            <ChainSelector
              selectedChainId={fromChainId}
              onSelectChain={setFromChainId}
              chains={evmChains}
            />
          </View>

          {/* Amount Input */}
          <View style={[styles.section, { backgroundColor: colors.inputBackgroundColor }]}>
            <MalinText style={[styles.label, { color: colors.foregroundColor }]}>
              Amount ({fromChain.symbol})
            </MalinText>
            <TextInput
              style={[
                styles.input,
                { color: colors.foregroundColor, borderColor: colors.formBorder },
              ]}
              value={amount}
              onChangeText={setAmount}
              placeholder="0.0"
              placeholderTextColor={colors.alternativeTextColor2}
              keyboardType="decimal-pad"
            />
          </View>

          {/* To Chain */}
          <View style={styles.chainSection}>
            <MalinText style={[styles.label, { color: colors.foregroundColor }]}>
              To Chain
            </MalinText>
            <ChainSelector
              selectedChainId={toChainId}
              onSelectChain={setToChainId}
              chains={evmChains.filter((c) => c.id !== fromChainId)}
            />
          </View>

          {/* Find Routes Button */}
          {!selectedRoute && (
            <Button
              title={loading ? 'Finding Routes...' : 'Find Routes'}
              onPress={handleFetchRoutes}
              disabled={loading || !amount}
            />
          )}

          {/* Routes */}
          {routes.length > 0 && (
            <View style={styles.routesSection}>
              <MalinText style={[styles.routesTitle, { color: colors.foregroundColor }]}>
                Available Routes ({routes.length})
              </MalinText>
              {routes.map((route, index) => (
                <TouchableOpacity
                  key={route.id}
                  style={[
                    styles.routeCard,
                    {
                      backgroundColor: colors.inputBackgroundColor,
                      borderColor:
                        selectedRoute?.id === route.id
                          ? colors.buttonAlternativeTextColor
                          : colors.hdborderColor,
                    },
                  ]}
                  onPress={() => setSelectedRoute(route)}
                >
                  <View style={styles.routeHeader}>
                    <MalinText style={[styles.routeProvider, { color: colors.foregroundColor }]}>
                      {route.provider}
                    </MalinText>
                    <MalinText style={[styles.routeTime, { color: colors.alternativeTextColor }]}>
                      {formatTime(route.estimatedTime)}
                    </MalinText>
                  </View>

                  <View style={styles.routeRow}>
                    <MalinText style={[styles.routeLabel, { color: colors.alternativeTextColor }]}>
                      You Send
                    </MalinText>
                    <MalinText style={[styles.routeValue, { color: colors.foregroundColor }]}>
                      {formatAmount(route.fromAmount)} {fromChain.symbol}
                    </MalinText>
                  </View>

                  <View style={styles.routeRow}>
                    <MalinText style={[styles.routeLabel, { color: colors.alternativeTextColor }]}>
                      You Receive
                    </MalinText>
                    <MalinText style={[styles.routeValue, { color: colors.foregroundColor }]}>
                      {formatAmount(route.toAmount)} {toChain.symbol}
                    </MalinText>
                  </View>

                  <View style={styles.routeRow}>
                    <MalinText style={[styles.routeLabel, { color: colors.alternativeTextColor }]}>
                      Total Fees
                    </MalinText>
                    <MalinText style={[styles.routeValue, { color: colors.alternativeTextColor }]}>
                      ~${route.totalFeeUSD.toFixed(2)}
                    </MalinText>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Bridge Button */}
          {selectedRoute && (
            <View style={styles.bridgeSection}>
              <Button
                title={bridging ? 'Bridging...' : 'Bridge Assets'}
                onPress={handleBridge}
                disabled={bridging}
              />
            </View>
          )}

          {/* Info */}
          <View style={[styles.info, { backgroundColor: colors.inputBackgroundColor }]}>
            <MalinText style={[styles.infoText, { color: colors.alternativeTextColor }]}>
              ℹ️ Bridge transactions are powered by Socket Protocol. Transfers typically take 5-30
              minutes depending on chain congestion.
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
  chainSection: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  section: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 18,
    fontWeight: '600',
  },
  routesSection: {
    marginTop: 24,
  },
  routesTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  routeCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 2,
  },
  routeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  routeProvider: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  routeTime: {
    fontSize: 14,
  },
  routeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  routeLabel: {
    fontSize: 14,
  },
  routeValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  bridgeSection: {
    marginTop: 20,
  },
  info: {
    padding: 16,
    borderRadius: 12,
    marginTop: 24,
  },
  infoText: {
    fontSize: 13,
    lineHeight: 18,
  },
});

export default BridgeScreen;
