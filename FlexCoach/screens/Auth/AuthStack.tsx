import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useStackOptions } from '../../navigation/stackOptions';
import { WelcomeScreen } from './screens/WelcomeScreen';
import { EmailAuthScreen } from './screens/EmailAuthScreen';
import { ForgotPasswordScreen } from './screens/ForgotPasswordScreen';

export type AuthStackParams = {
  WelcomeScreen: undefined;
  EmailAuthScreen: { mode: 'signin' | 'create' };
  ForgotPasswordScreen: { email?: string };
};

const Stack = createNativeStackNavigator<AuthStackParams>();

export const AuthStack = () => {
  const opts = useStackOptions();
  return (
    <Stack.Navigator screenOptions={opts.base}>
      <Stack.Screen name="WelcomeScreen" component={WelcomeScreen} options={{ headerShown: false }} />
      <Stack.Screen name="EmailAuthScreen" component={EmailAuthScreen} options={({ route }) => opts.screen(route.params.mode === 'create' ? 'Create account' : 'Sign in')} />
      <Stack.Screen name="ForgotPasswordScreen" component={ForgotPasswordScreen} options={opts.screen('Reset password')} />
    </Stack.Navigator>
  );
};
