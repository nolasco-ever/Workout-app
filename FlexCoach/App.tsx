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
import { CustomText } from './components/text/customText';

const App = () => {
  const appColors = colors();

  const backgroundStyle = {
    backgroundColor: appColors.background,
    padding: 10
  };

  return (
    <SafeAreaView style={backgroundStyle}>
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        style={backgroundStyle}
      >
        <View>
          <CustomText type='header' centered>Header Text</CustomText>
          <CustomText type='subheader' centered>Subheader text</CustomText>
          <CustomText>This is just body text. We'll see how this looks</CustomText>
        </View>
        <View style={{alignItems: 'center'}}>
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
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default App;
