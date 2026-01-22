// Copyright (C) 2026 MalinWallet Infrastructure - All Rights Reserved
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Alert,
} from 'react-native';
import { SwapAggregatorService } from '../../class/services/defi/swap-aggregator-service';
import { SwapRoute, SwapQuoteRequest } from '../../class/services/defi/swap-aggregator-types';
import { RouteCard } from '../../components/defi/RouteCard';

interface SwapAggregatorProps {
  navigation: any;
  route: any;
}

export const SwapAggregator: React.FC<SwapAggregatorProps> = ({ navigation, route }) => {
  const { wallet, chainId } = route.params || {};

  const [fromToken, setFromToken] = useState<any>(null);
  const [toToken, setToToken] = useState<any>(null);
  const [amount, setAmount] = useState('');
  const [slippage, setSlippage] = useState(0.5);
  const [routes, setRoutes] = useState<SwapRoute[]>([]);
  const [bestRoute, setBestRoute] = useState<SwapRoute | null>(null);
  const [loading, setLoading] = useState(false);
  const [executing, setExecuting] = useState(false);

  const swapService = SwapAggregatorService.getInstance();

  /**
   * Fetch swap quotes
   */
  const fetchQuotes = async () => {
    if (!fromToken || !toToken || !amount || parseFloat(amount) <= 0) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }

    try {
      setLoading(true);

      const request: SwapQuoteRequest = {
        chainId: chainId || 1,
        fromTokenAddress: fromToken.address,
        toTokenAddress: toToken.address,
        amount: (parseFloat(amount) * Math.pow(10, fromToken.decimals)).toString(),
        slippage,
        userAddress: wallet.getAddress(),
      };

      const response = await swapService.getSwapQuotes(request);
      
      setRoutes(response.routes);
      setBestRoute(response.bestRoute);
    } catch (error) {
      console.error('Error fetching quotes:', error);
      Alert.alert('Error', 'Failed to fetch swap quotes');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Execute swap
   */
  const executeSwap = async (route: SwapRoute) => {
    try {
      setExecuting(true);

      Alert.alert(
        'Confirm Swap',
        `Swap ${route.fromToken.amount} ${route.fromToken.symbol} for ~${route.toToken.amount} ${route.toToken.symbol}?\n\nGas Fee: ${route.gasFee.estimated} ETH\nSlippage: ${route.slippage}%`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Confirm',
            onPress: async () => {
              try {
                const result = await swapService.executeSwap(
                  {
                    route,
                    userAddress: wallet.getAddress(),
                    maxSlippage: slippage,
                  },
                  wallet
                );

                if (result.success) {
                  Alert.alert(
                    'Swap Successful!',
                    `Transaction: ${result.txHash}\n\nReceived: ${result.actualOutputAmount} ${route.toToken.symbol}`,
                    [{ text: 'OK', onPress: () => navigation.goBack() }]
                  );
                } else {
                  Alert.alert('Swap Failed', result.error || 'Unknown error');
                }
              } catch (error) {
                console.error('Error executing swap:', error);
                Alert.alert('Error', 'Failed to execute swap');
              } finally {
                setExecuting(false);
              }
            },
          },
        ]
      );
    } catch (error) {
      setExecuting(false);
    }
  };

  /**
   * Select token
   */
  const selectToken = (type: 'from' | 'to') => {
    navigation.navigate('TokenSelector', {
      chainId,
      onSelect: (token: any) => {
        if (type === 'from') {
          setFromToken(token);
        } else {
          setToToken(token);
        }
      },
    });
  };

  /**
   * Swap tokens
   */
  const swapTokens = () => {
    const temp = fromToken;
    setFromToken(toToken);
    setToToken(temp);
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Swap Aggregator</Text>
          <Text style={styles.subtitle}>Best rates from 1inch & Jupiter</Text>
        </View>

        {/* From Token */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>From</Text>
          <TouchableOpacity
            style={styles.tokenSelector}
            onPress={() => selectToken('from')}
          >
            <Text style={styles.tokenText}>
              {fromToken ? fromToken.symbol : 'Select Token'}
            </Text>
          </TouchableOpacity>
          <TextInput
            style={styles.amountInput}
            value={amount}
            onChangeText={setAmount}
            placeholder="0.0"
            placeholderTextColor="#999"
            keyboardType="decimal-pad"
          />
        </View>

        {/* Swap Button */}
        <TouchableOpacity style={styles.swapButton} onPress={swapTokens}>
          <Text style={styles.swapButtonText}>⇅</Text>
        </TouchableOpacity>

        {/* To Token */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>To</Text>
          <TouchableOpacity
            style={styles.tokenSelector}
            onPress={() => selectToken('to')}
          >
            <Text style={styles.tokenText}>
              {toToken ? toToken.symbol : 'Select Token'}
            </Text>
          </TouchableOpacity>
          {bestRoute && (
            <Text style={styles.estimatedAmount}>
              ≈ {(parseFloat(bestRoute.toToken.amount) / Math.pow(10, bestRoute.toToken.decimals)).toFixed(6)}
            </Text>
          )}
        </View>

        {/* Slippage Settings */}
        <View style={styles.slippageContainer}>
          <Text style={styles.label}>Slippage Tolerance</Text>
          <View style={styles.slippageButtons}>
            {[0.1, 0.5, 1.0, 3.0].map((value) => (
              <TouchableOpacity
                key={value}
                style={[
                  styles.slippageButton,
                  slippage === value && styles.slippageButtonActive,
                ]}
                onPress={() => setSlippage(value)}
              >
                <Text
                  style={[
                    styles.slippageButtonText,
                    slippage === value && styles.slippageButtonTextActive,
                  ]}
                >
                  {value}%
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Get Quotes Button */}
        <TouchableOpacity
          style={[styles.quotesButton, loading && styles.quotesButtonDisabled]}
          onPress={fetchQuotes}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.quotesButtonText}>Get Best Rates</Text>
          )}
        </TouchableOpacity>

        {/* Routes */}
        {routes.length > 0 && (
          <View style={styles.routesContainer}>
            <Text style={styles.routesTitle}>
              {routes.length} Route{routes.length > 1 ? 's' : ''} Found
            </Text>
            
            {routes.map((route, index) => (
              <RouteCard
                key={route.id}
                route={route}
                isBest={index === 0}
                onSelect={() => executeSwap(route)}
                disabled={executing}
              />
            ))}
          </View>
        )}

        {/* Loading Indicator */}
        {executing && (
          <View style={styles.executingOverlay}>
            <ActivityIndicator size="large" color="#FCD600" />
            <Text style={styles.executingText}>Executing Swap...</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#212121',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 20,
    backgroundColor: '#333',
    borderBottomWidth: 1,
    borderBottomColor: '#444',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FCD600',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#AAA',
  },
  inputContainer: {
    margin: 16,
    padding: 16,
    backgroundColor: '#2A2A2A',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#444',
  },
  label: {
    fontSize: 12,
    color: '#AAA',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  tokenSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#333',
    borderRadius: 8,
    marginBottom: 12,
  },
  tokenText: {
    fontSize: 16,
    color: '#FFF',
    fontWeight: '600',
  },
  amountInput: {
    fontSize: 32,
    color: '#FFF',
    fontWeight: 'bold',
    padding: 0,
  },
  estimatedAmount: {
    fontSize: 28,
    color: '#FCD600',
    fontWeight: 'bold',
    marginTop: 8,
  },
  swapButton: {
    alignSelf: 'center',
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: -24,
    zIndex: 10,
    borderWidth: 4,
    borderColor: '#212121',
  },
  swapButtonText: {
    fontSize: 24,
    color: '#FCD600',
  },
  slippageContainer: {
    margin: 16,
  },
  slippageButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  slippageButton: {
    flex: 1,
    padding: 12,
    backgroundColor: '#2A2A2A',
    borderRadius: 8,
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: '#444',
  },
  slippageButtonActive: {
    backgroundColor: '#FCD600',
    borderColor: '#FCD600',
  },
  slippageButtonText: {
    fontSize: 14,
    color: '#AAA',
    textAlign: 'center',
    fontWeight: '600',
  },
  slippageButtonTextActive: {
    color: '#000',
  },
  quotesButton: {
    margin: 16,
    padding: 16,
    backgroundColor: '#FCD600',
    borderRadius: 12,
    alignItems: 'center',
  },
  quotesButtonDisabled: {
    opacity: 0.5,
  },
  quotesButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
  },
  routesContainer: {
    margin: 16,
  },
  routesTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
    marginBottom: 12,
  },
  executingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  executingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#FCD600',
  },
});
