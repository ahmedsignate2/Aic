// Copyright (C) 2026 MalinWallet Infrastructure - All Rights Reserved
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '../../components/themes';
import { useExtendedNavigation } from '../../hooks/useExtendedNavigation';

const OnboardingWelcome: React.FC = () => {
  const { colors } = useTheme();
  const navigation = useExtendedNavigation();

  const stylesHook = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
      padding: 20,
      justifyContent: 'center',
      alignItems: 'center',
    },
    title: {
      fontSize: 32,
      fontWeight: 'bold',
      color: colors.foregroundColor,
      marginTop: 40,
      marginBottom: 20,
      textAlign: 'center',
    },
    subtitle: {
      fontSize: 18,
      color: colors.alternativeTextColor,
      textAlign: 'center',
      marginBottom: 60,
      paddingHorizontal: 20,
    },
    button: {
      backgroundColor: colors.buttonBackgroundColor,
      paddingVertical: 16,
      paddingHorizontal: 60,
      borderRadius: 12,
      marginBottom: 16,
      minWidth: 280,
    },
    buttonText: {
      color: colors.buttonTextColor,
      fontSize: 18,
      fontWeight: '600',
      textAlign: 'center',
    },
    skipButton: {
      paddingVertical: 12,
    },
    skipText: {
      color: colors.alternativeTextColor,
      fontSize: 16,
    },
  });

  const handleStart = () => {
    navigation.navigate('OnboardingCreateWallet');
  };

  const handleSkip = () => {
    navigation.navigate('WalletsList');
  };

  return (
    <View style={stylesHook.container}>
      <Text style={{ fontSize: 80 }}>🚀</Text>
      
      <Text style={stylesHook.title}>Bienvenue sur MalinWallet</Text>
      
      <Text style={stylesHook.subtitle}>
        Le wallet multi-chain le plus sécurisé et complet.{'\n\n'}
        Bitcoin, Ethereum, Solana, NFTs, DeFi et plus encore.
      </Text>

      <TouchableOpacity style={stylesHook.button} onPress={handleStart}>
        <Text style={stylesHook.buttonText}>Commencer</Text>
      </TouchableOpacity>

      <TouchableOpacity style={stylesHook.skipButton} onPress={handleSkip}>
        <Text style={stylesHook.skipText}>Passer l'introduction</Text>
      </TouchableOpacity>
    </View>
  );
};

export default OnboardingWelcome;
