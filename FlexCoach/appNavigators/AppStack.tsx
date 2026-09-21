import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { TabNavigator } from './TabNavigator';
import { NotificationsScreen } from '../screens/Tabs/Home/screens/NotificationsScreen';
import { PlansStack } from '../screens/Plans/PlansStack';
import { AuthStack } from '../screens/Auth/AuthStack';
import { OnboardingStack } from '../screens/Onboarding/OnboardingStack';
import { devFlags } from '../dev/flags';
import { useStackOptions } from '../navigation/stackOptions';

export type AppStackParams = {
    SignInStack: undefined;
    OnboardingStack: undefined;
    TabNavigator: undefined;
    NotificationsScreen: undefined;
    PlansStack: undefined;
};

const Stack = createNativeStackNavigator<AppStackParams>();

export const AppStack = () => {
    const opts = useStackOptions();
    return (
        <Stack.Navigator
            initialRouteName={__DEV__ && devFlags.startAtTabs ? 'TabNavigator' : 'SignInStack'}
            screenOptions={{ ...opts.base, headerShown: false }}
        >
            <Stack.Screen name="SignInStack" component={AuthStack} />
            <Stack.Screen name="OnboardingStack" component={OnboardingStack} options={{ gestureEnabled: false }} />
            <Stack.Screen name="TabNavigator" component={TabNavigator} options={{ gestureEnabled: false }} />
            <Stack.Screen name="NotificationsScreen" component={NotificationsScreen} options={opts.screen('Notifications')} />
            <Stack.Screen name="PlansStack" component={PlansStack} options={{ presentation: 'fullScreenModal' }} />
        </Stack.Navigator>
    );
};
