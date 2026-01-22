// Copyright (C) 2026 MalinWallet Infrastructure - All Rights Reserved
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useTheme } from '../../components/themes';
import { useExtendedNavigation } from '../../hooks/useExtendedNavigation';
import { NFCService } from '../../class/services/ux/nfc-service';

const NFCPayment: React.FC = () => {
  const { colors } = useTheme();
  const navigation = useExtendedNavigation();
  const [isReading, setIsReading] = useState(false);
  const [paymentData, setPaymentData] = useState<any>(null);

  const stylesHook = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    content: {
      padding: 20,
      alignItems: 'center',
    },
    title: {
      fontSize: 28,
      fontWeight: 'bold',
      color: colors.foregroundColor,
      marginBottom: 10,
      textAlign: 'center',
    },
    subtitle: {
      fontSize: 16,
      color: colors.alternativeTextColor,
      marginBottom: 40,
      textAlign: 'center',
    },
    nfcIcon: {
      fontSize: 120,
      marginVertical: 40,
    },
    statusText: {
      fontSize: 18,
      color: colors.foregroundColor,
      marginBottom: 20,
      textAlign: 'center',
    },
    dataBox: {
      backgroundColor: colors.inputBackgroundColor,
      padding: 20,
      borderRadius: 12,
      marginTop: 30,
      width: '100%',
    },
    dataLabel: {
      fontSize: 14,
      color: colors.alternativeTextColor,
      marginBottom: 5,
    },
    dataValue: {
      fontSize: 16,
      color: colors.foregroundColor,
      fontWeight: '600',
      marginBottom: 15,
    },
    button: {
      backgroundColor: colors.buttonBackgroundColor,
      paddingVertical: 16,
      paddingHorizontal: 60,
      borderRadius: 12,
      marginTop: 20,
      minWidth: 280,
    },
    buttonText: {
      color: colors.buttonTextColor,
      fontSize: 18,
      fontWeight: '600',
      textAlign: 'center',
    },
    cancelButton: {
      backgroundColor: colors.redText,
    },
  });

  const handleStartReading = async () => {
    setIsReading(true);
    setPaymentData(null);

    try {
      const service = NFCService.getInstance();
      const data = await service.readTag();
      
      if (data) {
        setPaymentData(data);
        Alert.alert(
          'Données de paiement reçues',
          `Adresse: ${data.address.substring(0, 10)}...${data.address.substring(data.address.length - 10)}\nMontant: ${data.amount || 'Non spécifié'}`,
          [
            {
              text: 'Envoyer',
              onPress: () => {
                navigation.navigate('SendDetails', {
                  address: data.address,
                  amount: data.amount,
                });
              },
            },
            { text: 'Annuler', style: 'cancel' },
          ]
        );
      }
    } catch (error: any) {
      Alert.alert('Erreur NFC', error.message);
    } finally {
      setIsReading(false);
    }
  };

  const handleStopReading = () => {
    setIsReading(false);
    setPaymentData(null);
  };

  return (
    <ScrollView style={stylesHook.container}>
      <View style={stylesHook.content}>
        <Text style={stylesHook.title}>📱 NFC Payment</Text>
        <Text style={stylesHook.subtitle}>
          Tapez votre téléphone contre un tag NFC pour recevoir les données de paiement
        </Text>

        <Text style={stylesHook.nfcIcon}>📡</Text>

        <Text style={stylesHook.statusText}>
          {isReading
            ? '🔵 Approchez votre téléphone du tag NFC...'
            : '⚪️ Appuyez sur le bouton pour démarrer'}
        </Text>

        {!isReading ? (
          <TouchableOpacity style={stylesHook.button} onPress={handleStartReading}>
            <Text style={stylesHook.buttonText}>Démarrer la lecture NFC</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[stylesHook.button, stylesHook.cancelButton]}
            onPress={handleStopReading}
          >
            <Text style={stylesHook.buttonText}>Annuler</Text>
          </TouchableOpacity>
        )}

        {paymentData && (
          <View style={stylesHook.dataBox}>
            <Text style={stylesHook.dataLabel}>Adresse</Text>
            <Text style={stylesHook.dataValue}>{paymentData.address}</Text>

            {paymentData.amount && (
              <>
                <Text style={stylesHook.dataLabel}>Montant</Text>
                <Text style={stylesHook.dataValue}>{paymentData.amount}</Text>
              </>
            )}

            {paymentData.token && (
              <>
                <Text style={stylesHook.dataLabel}>Token</Text>
                <Text style={stylesHook.dataValue}>{paymentData.token}</Text>
              </>
            )}

            {paymentData.chainId && (
              <>
                <Text style={stylesHook.dataLabel}>Chain ID</Text>
                <Text style={stylesHook.dataValue}>{paymentData.chainId}</Text>
              </>
            )}
          </View>
        )}
      </View>
    </ScrollView>
  );
};

export default NFCPayment;
