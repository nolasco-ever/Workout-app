import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import './components/icons/fontawesome';
import { AppStack } from './appNavigators/AppStack';

const App = () => {

  return (
    <NavigationContainer>
      <AppStack/>
    </NavigationContainer>
  );
};

export default App;
