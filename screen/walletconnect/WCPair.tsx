// Copyright (C) 2026 MalinWallet Infrastructure - All Rights Reserved
import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, Alert, TouchableOpacity } from 'react-native';
import { useTheme } from '../../components/themes';
import Button from '../../components/Button';
import SafeArea from '../../components/SafeArea';
import CameraScreen from '../../components/CameraScreen';
import { MalinText } from '../../MalinComponents';
import WalletConnectService from '../../class/services/walletconnect-service';
import loc from '../../loc';
import { useExtendedNavigation } from '../../hooks/useExtendedNavigation';

const WCPair: React.FC = () => {
  const { colors } = useTheme();
  const navigation = useExtendedNavigation();
  const [isLoading, setIsLoading] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [wcUri, setWcUri] = useState('');

  useEffect(() => {
    // Initialize WalletConnect on mount
    WalletConnectService.initialize().catch((error) => {
      console.error('Failed to initialize WalletConnect:', error);
      Alert.alert('Error', 'Failed to initialize WalletConnect');
    });
  }, []);

  const handleScanPress = () => {
    setShowCamera(true);
  };

  const handleBarCodeScanned = async (data: string) => {
    setShowCamera(false);

    if (!data.startsWith('wc:')) {
      Alert.alert('Error', 'Invalid WalletConnect URI. Please scan a valid QR code.');
      return;
    }

    setIsLoading(true);
    setWcUri(data);

    try {
      await WalletConnectService.pair(data);
      Alert.alert('Success', 'Pairing initiated. Please approve the connection request.');
      // Navigate back or to sessions list
      navigation.goBack();
    } catch (error: any) {
      console.error('Pairing error:', error);
      Alert.alert('Error', error.message || 'Failed to pair with DApp');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePastePress = async () => {
    // TODO: Implement paste from clipboard
    Alert.alert('Paste URI', 'Paste WalletConnect URI functionality coming soon');
  };

  if (showCamera) {
    return (
      <CameraScreen
        onBarCodeScanned={handleBarCodeScanned}
        showCloseButton
        onCloseButtonPressed={() => setShowCamera(false)}
      />
    );
  }

  return (
    <SafeArea style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        <MalinText style={[styles.title, { color: colors.foregroundColor }]}>
          Connect to DApp
        </MalinText>

        <MalinText style={[styles.description, { color: colors.alternativeTextColor }]}>
          Scan a WalletConnect QR code from a DApp to establish a secure connection.
        </MalinText>

        <View style={styles.iconContainer}>
          <Text style={styles.icon}>🔗</Text>
        </View>

        <Button
          title="Scan QR Code"
          onPress={handleScanPress}
          disabled={isLoading}
        />

        <TouchableOpacity
          style={styles.pasteButton}
          onPress={handlePastePress}
          disabled={isLoading}
        >
          <MalinText style={[styles.pasteText, { color: colors.buttonAlternativeTextColor }]}>
            or paste WalletConnect URI
          </MalinText>
        </TouchableOpacity>

        {isLoading && (
          <MalinText style={[styles.loadingText, { color: colors.alternativeTextColor }]}>
            Connecting to DApp...
          </MalinText>
        )}

        <View style={styles.infoBox}>
          <MalinText style={[styles.infoText, { color: colors.alternativeTextColor2 }]}>
            💡 WalletConnect allows you to securely connect to decentralized applications like Uniswap, OpenSea, and more.
          </MalinText>
        </View>
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
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    marginBottom: 32,
    textAlign: 'center',
    lineHeight: 24,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  icon: {
    fontSize: 80,
  },
  pasteButton: {
    marginTop: 16,
    padding: 12,
    alignItems: 'center',
  },
  pasteText: {
    fontSize: 16,
    textDecorationLine: 'underline',
  },
  loadingText: {
    marginTop: 16,
    textAlign: 'center',
    fontSize: 14,
  },
  infoBox: {
    marginTop: 32,
    padding: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(100, 100, 100, 0.1)',
  },
  infoText: {
    fontSize: 14,
    lineHeight: 20,
  },
});

export default WCPair;
