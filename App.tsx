// Copyright (C) 2026 MalinWallet Infrastructure - All Rights Reserved
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import React, { useEffect } from 'react';
import { useColorScheme } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { SizeClassProvider } from './components/Context/SizeClassProvider';
import { SettingsProvider } from './components/Context/SettingsProvider';
import MasterView from './navigation/MasterView';
import { navigationRef } from './NavigationService';
import { StorageProvider } from './components/Context/StorageProvider';
import { DeepLinkHandler } from './utils/deeplink-handler';
import { NotificationService } from './class/services/ux/notification-service';

const App = () => {
  const colorScheme = useColorScheme();

  // Intégration de Dark Gold Theme
  const theme = {
    ...DefaultTheme,
    dark: true,
    colors: {
      ...DefaultTheme.colors,
      background: '#212121',  // Noir mat
      text: '#FCD600',        // Or foncé
      primary: '#FCD600',    // Or
      card: '#333333',       // Gris très foncé
      border: '#757575',     // Gris moyen
      notification: '#FCD600',
    }
  };

  // Initialize deep link handling
  useEffect(() => {
    if (navigationRef.current) {
      const cleanup = DeepLinkHandler.initialize(navigationRef.current);
      return cleanup;
    }
  }, []);

  // Initialize notification service
  useEffect(() => {
    const initNotifications = async () => {
      try {
        const notificationService = NotificationService.getInstance();
        await notificationService.initialize();
        console.log('Notification service initialized');
      } catch (error) {
        console.error('Failed to initialize notifications:', error);
      }
    };
    initNotifications();
  }, []);

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