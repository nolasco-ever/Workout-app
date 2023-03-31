import React, {type PropsWithChildren} from 'react';
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from 'react-native';

import {
  Colors
} from 'react-native/Libraries/NewAppScreen';
import { colors } from './colors';
import { Button } from './components/buttons/button';

const App = () => {
  const appColors = colors();

  const backgroundStyle = {
    backgroundColor: appColors.background,
  };

  return (
    <SafeAreaView style={backgroundStyle}>
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        style={backgroundStyle}
        contentContainerStyle={{alignItems: 'center'}}
      >
          <Button
            onPress={() => console.log('primary button pressed')}
            title="Primary button"
            isPrimary
          />
          <Button
            onPress={() => console.log('secondary button pressed')}
            title="Secondary button"
            isPrimary={false}
          />
      </ScrollView>
    </SafeAreaView>
  );
};

export default App;
