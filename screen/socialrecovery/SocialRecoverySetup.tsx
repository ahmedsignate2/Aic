// Copyright (C) 2026 MalinWallet Infrastructure - All Rights Reserved
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useTheme } from '../../components/themes';
import { useExtendedNavigation } from '../../hooks/useExtendedNavigation';
import { SocialRecoveryService } from '../../class/services/ux/social-recovery-service';

const SocialRecoverySetup: React.FC = () => {
  const { colors } = useTheme();
  const navigation = useExtendedNavigation();
  const [threshold, setThreshold] = useState(2);
  const [totalGuardians, setTotalGuardians] = useState(3);

  const stylesHook = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    content: {
      padding: 20,
    },
    title: {
      fontSize: 28,
      fontWeight: 'bold',
      color: colors.foregroundColor,
      marginBottom: 10,
    },
    subtitle: {
      fontSize: 16,
      color: colors.alternativeTextColor,
      marginBottom: 30,
    },
    section: {
      marginBottom: 30,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.foregroundColor,
      marginBottom: 15,
    },
    selector: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      backgroundColor: colors.inputBackgroundColor,
      padding: 16,
      borderRadius: 12,
      marginBottom: 10,
    },
    selectorText: {
      fontSize: 16,
      color: colors.foregroundColor,
    },
    selectorButtons: {
      flexDirection: 'row',
      gap: 10,
    },
    selectorButton: {
      backgroundColor: colors.buttonBackgroundColor,
      paddingHorizontal: 20,
      paddingVertical: 8,
      borderRadius: 8,
    },
    selectorButtonText: {
      color: colors.buttonTextColor,
      fontSize: 16,
      fontWeight: '600',
    },
    infoBox: {
      backgroundColor: colors.inputBackgroundColor,
      padding: 16,
      borderRadius: 12,
      marginBottom: 20,
    },
    infoText: {
      fontSize: 14,
      color: colors.alternativeTextColor,
      lineHeight: 22,
    },
    button: {
      backgroundColor: colors.buttonBackgroundColor,
      paddingVertical: 16,
      borderRadius: 12,
      marginTop: 20,
    },
    buttonText: {
      color: colors.buttonTextColor,
      fontSize: 18,
      fontWeight: '600',
      textAlign: 'center',
    },
  });

  const handleSetup = async () => {
    try {
      const service = SocialRecoveryService.getInstance();
      
      // For demo, use a mock seed and wallet ID
      const mockWalletId = 'default-wallet';
      const mockSeed = 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';
      
      // Create mock guardians
      const mockGuardians = Array.from({ length: totalGuardians }, (_, i) => ({
        name: `Guardian ${i + 1}`,
        contact: `guardian${i + 1}@example.com`,
      }));
      
      const result = await service.setupRecovery(mockWalletId, mockSeed, mockGuardians, threshold);
      
      Alert.alert(
        'Récupération sociale configurée',
        `${result.guardians.length} gardiens ont été créés. Partagez les codes QR avec vos gardiens de confiance.`,
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error: any) {
      Alert.alert('Erreur', error.message);
    }
  };

  return (
    <ScrollView style={stylesHook.container}>
      <View style={stylesHook.content}>
        <Text style={stylesHook.title}>🤝 Social Recovery</Text>
        <Text style={stylesHook.subtitle}>
          Récupérez votre wallet avec l'aide de gardiens de confiance
        </Text>

        <View style={stylesHook.section}>
          <Text style={stylesHook.sectionTitle}>Nombre de gardiens</Text>
          <View style={stylesHook.selector}>
            <Text style={stylesHook.selectorText}>{totalGuardians} gardiens</Text>
            <View style={stylesHook.selectorButtons}>
              <TouchableOpacity
                style={stylesHook.selectorButton}
                onPress={() => setTotalGuardians(Math.max(2, totalGuardians - 1))}
              >
                <Text style={stylesHook.selectorButtonText}>-</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={stylesHook.selectorButton}
                onPress={() => setTotalGuardians(Math.min(10, totalGuardians + 1))}
              >
                <Text style={stylesHook.selectorButtonText}>+</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View style={stylesHook.section}>
          <Text style={stylesHook.sectionTitle}>Seuil de récupération</Text>
          <View style={stylesHook.selector}>
            <Text style={stylesHook.selectorText}>{threshold} sur {totalGuardians}</Text>
            <View style={stylesHook.selectorButtons}>
              <TouchableOpacity
                style={stylesHook.selectorButton}
                onPress={() => setThreshold(Math.max(2, threshold - 1))}
              >
                <Text style={stylesHook.selectorButtonText}>-</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={stylesHook.selectorButton}
                onPress={() => setThreshold(Math.min(totalGuardians, threshold + 1))}
              >
                <Text style={stylesHook.selectorButtonText}>+</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View style={stylesHook.infoBox}>
          <Text style={stylesHook.infoText}>
            💡 Le seuil détermine combien de gardiens minimum sont nécessaires pour récupérer votre wallet.{'\n\n'}
            ✓ Plus sécurisé: 3 sur 5{'\n'}
            ✓ Recommandé: 2 sur 3{'\n'}
            ✓ Minimum: 2 sur 2
          </Text>
        </View>

        <TouchableOpacity style={stylesHook.button} onPress={handleSetup}>
          <Text style={stylesHook.buttonText}>Configurer</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

export default SocialRecoverySetup;
