import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import './components/icons/fontawesome';
import { AppStack } from './appNavigators/AppStack';
import { ThemeProvider } from './packages/core-contexts/theme-context';
import { ModalProvider } from './packages/core-contexts/modal-context';
import { CustomModal } from './packages/core-components/Modal/CustomModal';

const App = () => {

  return (
    <ThemeProvider appTheme='system'>
      <ModalProvider>
        <NavigationContainer>
          <AppStack/>
        </NavigationContainer>
        <CustomModal/>
      </ModalProvider>
    </ThemeProvider>
  );
};

export default App;
