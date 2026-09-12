import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AuthProvider } from './providers/AuthProvider';
import { LanguageProvider } from './providers/LanguageProvider';
import { RoleProvider } from './providers/RoleProvider';
import { AppNavigator } from '../navigation/AppNavigator';

export function AppRoot() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <LanguageProvider>
          <RoleProvider>
            <NavigationContainer>
              <AppNavigator />
            </NavigationContainer>
          </RoleProvider>
        </LanguageProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
