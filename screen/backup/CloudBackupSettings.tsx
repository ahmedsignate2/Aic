// Copyright (C) 2026 MalinWallet Infrastructure - All Rights Reserved
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, TextInput } from 'react-native';
import { useTheme } from '../../components/themes';
import { useExtendedNavigation } from '../../hooks/useExtendedNavigation';
import { CloudBackupService } from '../../class/services/ux/cloud-backup-service';

const CloudBackupSettings: React.FC = () => {
  const { colors } = useTheme();
  const navigation = useExtendedNavigation();
  const [password, setPassword] = useState('');
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);

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
    input: {
      backgroundColor: colors.inputBackgroundColor,
      color: colors.foregroundColor,
      padding: 16,
      borderRadius: 12,
      fontSize: 16,
      marginBottom: 10,
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
      marginBottom: 12,
    },
    buttonText: {
      color: colors.buttonTextColor,
      fontSize: 18,
      fontWeight: '600',
      textAlign: 'center',
    },
    dangerButton: {
      backgroundColor: colors.redText,
    },
  });

  const handleBackup = async () => {
    if (!password || password.length < 8) {
      Alert.alert('Erreur', 'Le mot de passe doit contenir au moins 8 caractères');
      return;
    }

    setIsBackingUp(true);
    try {
      const service = CloudBackupService.getInstance();
      const result = await service.backupToCloud('default-wallet-id', password);
      
      Alert.alert(
        'Backup réussi',
        `Votre wallet a été sauvegardé de manière sécurisée.\n\nTaille: ${(result.size / 1024).toFixed(1)} KB\nChiffrement: AES-256-GCM`
      );
    } catch (error: any) {
      Alert.alert('Erreur', error.message);
    } finally {
      setIsBackingUp(false);
    }
  };

  const handleRestore = async () => {
    if (!password || password.length < 8) {
      Alert.alert('Erreur', 'Entrez votre mot de passe de backup');
      return;
    }

    Alert.alert(
      'Confirmation',
      'La restauration va remplacer vos données actuelles. Continuer?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Restaurer',
          style: 'destructive',
          onPress: async () => {
            setIsRestoring(true);
            try {
              const service = CloudBackupService.getInstance();
              await service.restoreFromCloud('default-wallet-id', password);
              
              Alert.alert(
                'Restauration réussie',
                'Vos données ont été restaurées. Redémarrez l\'application.',
                [{ text: 'OK', onPress: () => navigation.navigate('WalletsList') }]
              );
            } catch (error: any) {
              Alert.alert('Erreur', error.message);
            } finally {
              setIsRestoring(false);
            }
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={stylesHook.container}>
      <View style={stylesHook.content}>
        <Text style={stylesHook.title}>☁️ Cloud Backup</Text>
        <Text style={stylesHook.subtitle}>
          Sauvegardez vos données de manière sécurisée dans le cloud
        </Text>

        <View style={stylesHook.infoBox}>
          <Text style={stylesHook.infoText}>
            🔒 Chiffrement AES-256-GCM{'\n'}
            📦 Wallets, paramètres, et configurations{'\n'}
            🚫 Vos seed phrases ne sont JAMAIS sauvegardées{'\n'}
            🔑 Seul votre mot de passe peut déchiffrer
          </Text>
        </View>

        <View style={stylesHook.section}>
          <Text style={stylesHook.sectionTitle}>Mot de passe de backup</Text>
          <TextInput
            style={stylesHook.input}
            placeholder="8 caractères minimum"
            placeholderTextColor={colors.alternativeTextColor}
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            autoCapitalize="none"
          />
        </View>

        <TouchableOpacity
          style={stylesHook.button}
          onPress={handleBackup}
          disabled={isBackingUp}
        >
          <Text style={stylesHook.buttonText}>
            {isBackingUp ? 'Backup en cours...' : 'Créer un backup'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[stylesHook.button, stylesHook.dangerButton]}
          onPress={handleRestore}
          disabled={isRestoring}
        >
          <Text style={stylesHook.buttonText}>
            {isRestoring ? 'Restauration...' : 'Restaurer depuis backup'}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

export default CloudBackupSettings;
