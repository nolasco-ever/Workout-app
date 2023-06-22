import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import './components/icons/fontawesome';
import { AppStack } from './appNavigators/AppStack';
import { ThemeProvider } from './packages/core-contexts/theme-context';

const App = () => {

  return (
    <ThemeProvider appTheme='system'>
      <NavigationContainer>
        <AppStack/>
      </NavigationContainer>
    </ThemeProvider>
  );
};

export default App;
