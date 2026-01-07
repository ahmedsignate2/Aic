import AsyncStorage from '@react-native-async-storage/async-storage';
import DefaultPreference from 'react-native-default-preference';
import { MalinApp } from '../class';
import { GROUP_IO_MALINWALLET } from '../malin_modules/currency';

// Function to get the value from DefaultPreference first, then fallback to AsyncStorage 
// as DefaultPreference uses truly native storage.
// If found in AsyncStorage, migrate it to DefaultPreference and remove it from AsyncStorage.
export const getLNDHub = async (): Promise<string | undefined> => {
  try {
    await DefaultPreference.setName(GROUP_IO_MALINWALLET);
    let value = await DefaultPreference.get(MalinApp.LNDHUB) as string | null;

    // If not found, check AsyncStorage and migrate it to DefaultPreference
    if (!value) {
      value = await AsyncStorage.getItem(MalinApp.LNDHUB);

      if (value) {
        await DefaultPreference.set(MalinApp.LNDHUB, value);
        await AsyncStorage.removeItem(MalinApp.LNDHUB);
        console.log('Migrated LNDHub value from AsyncStorage to DefaultPreference');
      }
    }

    return value ?? undefined;
  } catch (error) {
    console.error('Error getting LNDHub preference:', (error as Error).message);
    return undefined;
  }
};

export const setLNDHub = async (value: string): Promise<void> => {
  try {
    await DefaultPreference.setName(GROUP_IO_MALINWALLET);
    await DefaultPreference.set(MalinApp.LNDHUB, value);
  } catch (error) {
    console.error('Error setting LNDHub preference:', error);
  }
};

export const clearLNDHub = async (): Promise<void> => {
  try {
    await DefaultPreference.setName(GROUP_IO_MALINWALLET);
    await DefaultPreference.clear(MalinApp.LNDHUB);
    await AsyncStorage.removeItem(MalinApp.LNDHUB);
  } catch (error) {
    console.error('Error clearing LNDHub preference:', error);
  }
};