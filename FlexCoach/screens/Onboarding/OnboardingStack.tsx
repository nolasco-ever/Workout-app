import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useStackOptions } from '../../navigation/stackOptions';
import { AboutYouScreen } from './screens/AboutYouScreen';
import { ProfilePhotoScreen } from './screens/ProfilePhotoScreen';
import { FirstPlanScreen } from './screens/FirstPlanScreen';

export type OnboardingStackParams = {
  AboutYouScreen: undefined;
  ProfilePhotoScreen: undefined;
  FirstPlanScreen: undefined;
};

const Stack = createNativeStackNavigator<OnboardingStackParams>();

/** Three short steps after account creation. Each can be finished later from Profile. */
export const OnboardingStack = () => {
  const opts = useStackOptions();
  return (
    <Stack.Navigator screenOptions={{ ...opts.base, headerBackVisible: false, gestureEnabled: false }}>
      <Stack.Screen name="AboutYouScreen" component={AboutYouScreen} options={opts.screen('About you  ·  1 of 3')} />
      <Stack.Screen name="ProfilePhotoScreen" component={ProfilePhotoScreen} options={opts.screen('Your photo  ·  2 of 3')} />
      <Stack.Screen name="FirstPlanScreen" component={FirstPlanScreen} options={opts.screen('Your plan  ·  3 of 3')} />
    </Stack.Navigator>
  );
};
