// Copyright (C) 2026 MalinWallet Infrastructure - All Rights Reserved
import React from 'react';
import DefaultPreference from 'react-native-default-preference';
// @ts-ignore: Handoff is not typed
import Handoff from 'react-native-handoff';
import { useSettings } from '../hooks/context/useSettings';
import { GROUP_IO_MALINWALLET } from '../malin_modules/currency';
import { MalinApp } from '../class';
import { HandOffComponentProps } from './types';

const HandOffComponent: React.FC<HandOffComponentProps> = props => {
  const { isHandOffUseEnabled } = useSettings();
  if (!props || !props.type || !props.userInfo || Object.keys(props.userInfo).length === 0) {
    console.debug('HandOffComponent: Missing required type or userInfo data');
    return null;
  }
  const userInfo = JSON.stringify(props.userInfo);
  console.debug(`HandOffComponent is rendering. Type: ${props.type}, UserInfo: ${userInfo}...`);
  return isHandOffUseEnabled ? <Handoff {...props} /> : null;
};

const MemoizedHandOffComponent = React.memo(HandOffComponent);

export const setIsHandOffUseEnabled = async (value: boolean) => {
  try {
    await DefaultPreference.setName(GROUP_IO_MALINWALLET);
    await DefaultPreference.set(MalinApp.HANDOFF_STORAGE_KEY, value.toString());
    console.debug('setIsHandOffUseEnabled', value);
  } catch (error) {
    console.error('Error setting handoff enabled status:', error);
    throw error; // Propagate error to caller
  }
};

export const getIsHandOffUseEnabled = async (): Promise<boolean> => {
  try {
    await DefaultPreference.setName(GROUP_IO_MALINWALLET);
    const isEnabledValue = await DefaultPreference.get(MalinApp.HANDOFF_STORAGE_KEY);
    const result = isEnabledValue === 'true';
    console.debug('getIsHandOffUseEnabled', result);
    return result;
  } catch (error) {
    console.error('Error getting handoff enabled status:', error);
    return false;
  }
};

export default MemoizedHandOffComponent;
