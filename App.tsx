import { NavigationContainer } from '@react-navigation/native';
import React from 'react';
import { useColorScheme } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { SizeClassProvider } from './components/Context/SizeClassProvider';
import { SettingsProvider } from './components/Context/SettingsProvider';
import MasterView from './navigation/MasterView';
import { navigationRef } from './NavigationService';
import { useDevTools } from '@react-navigation/devtools';
import { StorageProvider } from './components/Context/StorageProvider';

const App = () => {
  const colorScheme = useColorScheme();

  // Intégration de Dark Gold Theme
  const theme = {
    dark: true,
    colors: {
      background: '#212121',  // Noir mat
      text: '#FCD600',        // Or foncé
      primary: '#FCD600',    // Or
      card: '#333333',       // Gris très foncé
      border: '#757575',     // Gris moyen
      notification: '#FCD600',
    }
  };

  useDevTools(navigationRef);

  return (
    <SizeClassProvider>
      <NavigationContainer ref={navigationRef} theme={theme}>
        <SafeAreaProvider style={{ backgroundColor: theme.colors.background }}>
          <StorageProvider>
            <SettingsProvider>
              <MasterView />
            </SettingsProvider>
          </StorageProvider>
        </SafeAreaProvider>
      </NavigationContainer>
    </SizeClassProvider>
  );
};

export default App;