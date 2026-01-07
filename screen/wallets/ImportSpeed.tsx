// Copyright (C) 2026 MalinWallet Infrastructure - All Rights Reserved
import { useNavigation } from '@react-navigation/native';
import React, { useState } from 'react';
import { ActivityIndicator, StyleSheet, TextInput, View } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MalinFormLabel, MalinFormMultiInput } from '../../MalinComponents';
import { HDSegwitBech32Wallet, WatchOnlyWallet } from '../../class';
import presentAlert from '../../components/Alert';
import Button from '../../components/Button';
import SafeArea from '../../components/SafeArea';
import { useTheme } from '../../components/themes';
import { useStorage } from '../../hooks/context/useStorage';
import { AddWalletStackParamList } from '../../navigation/AddWalletStack';
import { MalinSpacing20 } from '../../components/MalinSpacing';

type NavigationProp = NativeStackNavigationProp<AddWalletStackParamList, 'ImportSpeed'>;

const ImportSpeed = () => {
  const navigation = useNavigation<NavigationProp>();
  const { colors } = useTheme();
  const [loading, setLoading] = useState<boolean>(false);
  const [importText, setImportText] = useState<string>('');
  const [walletType, setWalletType] = useState<string>('');
  const [passphrase, setPassphrase] = useState<string>('');
  const { addAndSaveWallet } = useStorage();

  const styles = StyleSheet.create({
    root: {
      paddingTop: 40,
      backgroundColor: colors.elevated,
    },
    center: {
      flex: 1,
      marginHorizontal: 16,
      backgroundColor: colors.elevated,
    },
    pathInput: {
      flexDirection: 'row',
      borderWidth: 1,
      borderBottomWidth: 0.5,
      minHeight: 44,
      height: 44,
      alignItems: 'center',
      marginVertical: 8,
      borderRadius: 4,
      paddingHorizontal: 8,
      color: '#81868e',
      borderColor: colors.formBorder,
      borderBottomColor: colors.formBorder,
      backgroundColor: colors.inputBackgroundColor,
    },
  });

  const importMnemonic = async () => {
    setLoading(true);
    try {
      let WalletClass;
      switch (walletType) {
        case HDSegwitBech32Wallet.type:
          WalletClass = HDSegwitBech32Wallet;
          break;
        case WatchOnlyWallet.type:
          WalletClass = WatchOnlyWallet;
          break;
      }

      if (!WalletClass) {
        throw new Error('Invalid wallet type');
      }

      const wallet = new WalletClass();
      wallet.setSecret(importText);
      // check wallet is type of HDSegwitBech32Wallet
      if (passphrase && wallet instanceof HDSegwitBech32Wallet) {
        wallet.setPassphrase(passphrase);
      }
      await wallet.fetchBalance();
      navigation.getParent()?.goBack();
      addAndSaveWallet(wallet);
    } catch (e: any) {
      presentAlert({ message: e.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeArea style={styles.root}>
      <MalinSpacing20 />
      <MalinFormLabel>Mnemonic</MalinFormLabel>
      <MalinSpacing20 />
      <MalinFormMultiInput testID="SpeedMnemonicInput" value={importText} onChangeText={setImportText} />
      <MalinFormLabel>Wallet type</MalinFormLabel>
      <TextInput testID="SpeedWalletTypeInput" value={walletType} style={styles.pathInput} onChangeText={setWalletType} />
      <MalinFormLabel>Passphrase</MalinFormLabel>
      <TextInput testID="SpeedPassphraseInput" value={passphrase} style={styles.pathInput} onChangeText={setPassphrase} />
      <MalinSpacing20 />
      <View style={styles.center}>
        <Button testID="SpeedDoImport" title="Import" onPress={importMnemonic} />
        {loading && <ActivityIndicator />}
      </View>
    </SafeArea>
  );
};

export default ImportSpeed;
