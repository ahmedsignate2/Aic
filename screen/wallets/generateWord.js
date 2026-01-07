// Copyright (C) 2026 MalinWallet Infrastructure - All Rights Reserved
import { useTheme } from '@react-navigation/native';
import React, { useState } from 'react';
import { Keyboard, StyleSheet, TextInput, View } from 'react-native';

import { generateChecksumWords } from '../../malin_modules/checksumWords';
import { MalinCard, MalinText } from '../../MalinComponents';
import { randomBytes } from '../../class/rng';
import Button from '../../components/Button';
import loc from '../../loc';
import SafeAreaScrollView from '../../components/SafeAreaScrollView';
import { MalinSpacing10, MalinSpacing20 } from '../../components/MalinSpacing';

const GenerateWord = () => {
  const { colors } = useTheme();

  const [mnemonic, setMnemonic] = useState('');
  const [result, setResult] = useState('');

  const stylesHooks = StyleSheet.create({
    input: {
      borderColor: colors.formBorder,
      borderBottomColor: colors.formBorder,
      backgroundColor: colors.inputBackgroundColor,
    },
  });

  const handleUpdateMnemonic = nextValue => {
    setMnemonic(nextValue);
    setResult();
  };

  const checkMnemonic = async () => {
    Keyboard.dismiss();

    const seedPhrase = mnemonic.toString();

    const possibleWords = generateChecksumWords(seedPhrase);

    if (!possibleWords) {
      // likely because of an invalid mnemonic
      setResult(loc.autofill_word.error);
      return;
    }

    const random = await randomBytes(1);
    const randomindex = Math.round((random[0] / 255) * (possibleWords.length - 1));

    setResult(possibleWords[randomindex]);
  };

  const clearMnemonicInput = () => {
    setMnemonic('');
    setResult();
  };

  return (
    <SafeAreaScrollView
      style={styles.malinArea}
      keyboardShouldPersistTaps="handled"
      automaticallyAdjustContentInsets
      automaticallyAdjustKeyboardInsets
      contentInsetAdjustmentBehavior="automatic"
    >
      <View style={styles.wrapper}>
        <MalinCard style={styles.mainCard}>
          <View style={[styles.input, stylesHooks.input]}>
            <TextInput
              style={styles.text}
              maxHeight={100}
              minHeight={100}
              maxWidth="100%"
              minWidth="100%"
              multiline
              editable
              placeholder={loc.autofill_word.enter}
              placeholderTextColor="#81868e"
              value={mnemonic}
              onChangeText={handleUpdateMnemonic}
              testID="MnemonicInput"
            />
          </View>

          <MalinSpacing10 />
          <Button title={loc.send.input_clear} onPress={clearMnemonicInput} />
          <MalinSpacing20 />
          <MalinText style={styles.center} testID="Result">
            {result}
          </MalinText>
          <MalinSpacing20 />
          <View>
            <Button
              disabled={mnemonic.trim().length === 0}
              title={loc.autofill_word.generate_word}
              onPress={checkMnemonic}
              testID="GenerateWord"
            />
          </View>
          <MalinSpacing20 />
        </MalinCard>
      </View>
    </SafeAreaScrollView>
  );
};

export default GenerateWord;

const styles = StyleSheet.create({
  wrapper: {
    marginTop: 16,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  malinArea: {
    paddingTop: 19,
  },
  mainCard: {
    padding: 0,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  input: {
    flexDirection: 'row',
    borderWidth: 1,
    borderBottomWidth: 0.5,
    alignItems: 'center',
    borderRadius: 4,
  },
  center: {
    textAlign: 'center',
  },
  text: {
    padding: 8,
    minHeight: 33,
    color: '#81868e',
  },
});
