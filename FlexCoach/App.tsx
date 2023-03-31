import React, {useState, type PropsWithChildren} from 'react';
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from 'react-native';

import './components/icons/fontawesome';
import { colors } from './colors';
import { Button } from './components/buttons/button';
import { CustomTextInput } from './components/text-input/customTextInput';
import { CustomText } from './components/text/customText';
import { generalIcons } from './components/icons/icon-library';
import { UserCardHeader } from './components/cards/userCardHeader';
import { NotificationButton } from './components/buttons/notificationButton';

const App = () => {
  const appColors = colors();

  const backgroundStyle = {
    backgroundColor: appColors.background,
    padding: 10
  };

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  return (
    <SafeAreaView style={[backgroundStyle, {display: 'flex', flex: 1}]}>
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        style={[backgroundStyle]}
      >
        <UserCardHeader
          profilePhoto='https://picsum.photos/200'
          welcomeMessage='Welcome back, Ever!'
        />
        <NotificationButton
          unseenNotifications={true}
          onPress={() => console.log('pressed')}
        />
        <View>
          <CustomText type='header' centered>Header Text</CustomText>
          <CustomText type='subheader' centered>Subheader text</CustomText>
          <CustomText>This is just body text. We'll see how this looks</CustomText>
        </View>
        <View>
        <View style={{alignItems: 'center'}}>
          <CustomTextInput
            icon={generalIcons.envelope}
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
          />
          <CustomTextInput
            icon={generalIcons.key}
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            isPassword
          />
        </View>
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
