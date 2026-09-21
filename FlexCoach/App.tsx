import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { AppStack } from './appNavigators/AppStack';
import { ThemeProvider } from './packages/core-contexts/theme-context';
import { ModalProvider } from './packages/core-contexts/modal-context';
import { CustomModal } from './packages/core-components/Modal/CustomModal';
import { AuthProvider } from './data/auth/AuthProvider';
import { SafeAreaProvider } from 'react-native-safe-area-context';

const App = () => {

  return (
    <SafeAreaProvider>
      <AuthProvider>
      <ThemeProvider appTheme='system'>
        <ModalProvider>
          <NavigationContainer>
            <AppStack/>
          </NavigationContainer>
          <CustomModal/>
        </ModalProvider>
      </ThemeProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
};

export default App;
