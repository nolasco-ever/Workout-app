import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { NavigatorScreenParams } from '@react-navigation/native';
import { TabNavigator } from './TabNavigator';
import { NotificationsScreen } from '../screens/Tabs/Home/screens/NotificationsScreen';
import { PlansStack, type PlansStackParams } from '../screens/Plans/PlansStack';
import { AuthStack } from '../screens/Auth/AuthStack';
import { OnboardingStack } from '../screens/Onboarding/OnboardingStack';
import { AccountScreen } from '../screens/Tabs/Profile/screens/AccountScreen';
import { devFlags } from '../dev/flags';
import { useStackOptions } from '../navigation/stackOptions';
import { useAuth } from '../data/auth/AuthProvider';
import { useTheme } from '../theme';

export type AppStackParams = {
    AuthStack: undefined;
    OnboardingStack: undefined;
    TabNavigator: undefined;
    NotificationsScreen: undefined;
    PlansStack: NavigatorScreenParams<PlansStackParams> | undefined;
    AccountScreen: undefined;
};

const Stack = createNativeStackNavigator<AppStackParams>();

/**
 * Routes by account state. No session sees the welcome screen; a signed-in
 * user without onboarding sees onboarding; everyone else the tabs. React Navigation swaps the route set, so there's nothing to
 * navigate to manually after signing in or out.
 */
export const AppStack = () => {
    const opts = useStackOptions();
    const { colors } = useTheme();
    const { ready, uid, profile } = useAuth();
    const bypass = __DEV__ && devFlags.startAtTabs;
    const signedIn = bypass || !!uid;
    const onboarded = bypass || !!profile?.onboardingCompletedAt;

    if (!ready) {
        return (
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.ground }}>
                <ActivityIndicator color={colors.accent} />
            </View>
        );
    }

    return (
        <Stack.Navigator screenOptions={{ ...opts.base, headerShown: false }}>
            {!signedIn ? (
                <Stack.Screen name="AuthStack" component={AuthStack} options={{ animation: 'fade' }} />
            ) : !onboarded ? (
                <Stack.Screen name="OnboardingStack" component={OnboardingStack} options={{ animation: 'fade', gestureEnabled: false }} />
            ) : (
                <>
                    <Stack.Screen name="TabNavigator" component={TabNavigator} options={{ animation: 'fade', gestureEnabled: false }} />
                    <Stack.Screen name="NotificationsScreen" component={NotificationsScreen} options={opts.screen('Notifications')} />
                    <Stack.Screen name="AccountScreen" component={AccountScreen} options={opts.screen('Account')} />
                    <Stack.Screen name="PlansStack" component={PlansStack} options={{ presentation: 'fullScreenModal' }} />
                </>
            )}
        </Stack.Navigator>
    );
};
