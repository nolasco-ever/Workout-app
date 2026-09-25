import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useStackOptions } from '../../navigation/stackOptions';
import { AboutYouScreen } from './screens/AboutYouScreen';
import { ProfilePhotoScreen } from './screens/ProfilePhotoScreen';
import { NotificationsOnboardingScreen } from './screens/NotificationsOnboardingScreen';
import { FirstPlanScreen } from './screens/FirstPlanScreen';

export type OnboardingStackParams = {
  AboutYouScreen: undefined;
  ProfilePhotoScreen: undefined;
  NotificationsOnboardingScreen: undefined;
  FirstPlanScreen: undefined;
};

const Stack = createNativeStackNavigator<OnboardingStackParams>();

/** Four short steps after account creation. Each can be finished later from Profile. */
export const OnboardingStack = () => {
  const opts = useStackOptions();
  return (
    <Stack.Navigator screenOptions={{ ...opts.base, headerBackVisible: false, gestureEnabled: false }}>
      <Stack.Screen name="AboutYouScreen" component={AboutYouScreen} options={opts.screen('About you  ·  1 of 4')} />
      <Stack.Screen name="ProfilePhotoScreen" component={ProfilePhotoScreen} options={opts.screen('Your photo  ·  2 of 4')} />
      <Stack.Screen name="NotificationsOnboardingScreen" component={NotificationsOnboardingScreen} options={opts.screen('Reminders  ·  3 of 4')} />
      <Stack.Screen name="FirstPlanScreen" component={FirstPlanScreen} options={opts.screen('Your plan  ·  4 of 4')} />
    </Stack.Navigator>
  );
};
