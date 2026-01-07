// Copyright (C) 2026 MalinWallet Infrastructure - All Rights Reserved
import React from 'react';
import { InputAccessoryView, Keyboard, Platform, StyleSheet, View } from 'react-native';
import { useTheme } from './themes';
import { MalinButtonLink } from '../MalinComponents';
import loc from '../loc';

export const DismissKeyboardInputAccessoryViewID = 'DismissKeyboardInputAccessory';
export const DismissKeyboardInputAccessory: React.FC = () => {
  const { colors } = useTheme();
  const styleHooks = StyleSheet.create({
    container: {
      backgroundColor: colors.inputBackgroundColor,
    },
  });

  if (Platform.OS !== 'ios') {
    return null;
  }

  return (
    <InputAccessoryView nativeID={DismissKeyboardInputAccessoryViewID}>
      <View style={[styles.container, styleHooks.container]}>
        <MalinButtonLink title={loc.send.input_done} onPress={Keyboard.dismiss} />
      </View>
    </InputAccessoryView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    maxHeight: 44,
  },
});
