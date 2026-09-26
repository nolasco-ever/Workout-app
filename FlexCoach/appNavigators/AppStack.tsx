import React, { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { NavigatorScreenParams } from '@react-navigation/native';
import { TabNavigator } from './TabNavigator';
import { NotificationsScreen } from '../screens/Tabs/Home/screens/NotificationsScreen';
import { PlansStack, type PlansStackParams } from '../screens/Plans/PlansStack';
import { AuthStack } from '../screens/Auth/AuthStack';
import { OnboardingStack } from '../screens/Onboarding/OnboardingStack';
import { AccountScreen } from '../screens/Tabs/Profile/screens/AccountScreen';
import { ExerciseDetailScreen } from '../screens/Tabs/Workout/screens/ExerciseDetailScreen';
import { BuddiesScreen } from '../screens/Buddies/BuddiesScreen';
import { CardStack } from '../screens/Buddies/CardStack';
import { BuddyCardScreen } from '../screens/Buddies/BuddyCardScreen';
import { BuddyActivityScreen } from '../screens/Buddies/BuddyActivityScreen';
import { BuddyPlansScreen } from '../screens/Buddies/BuddyPlansScreen';
import { BuddyPlanScreen } from '../screens/Buddies/BuddyPlanScreen';
import type { BuddyRoutes } from '../screens/Buddies/routes';
import { HeaderButton } from '../components/headers/HeaderButton';
import { generalIcons } from '../components/icons/icon-library';
import { devFlags } from '../dev/flags';
import { useStackOptions } from '../navigation/stackOptions';
import { useAuth } from '../data/auth/AuthProvider';
import { ensurePhotoCacheable } from '../data/services/profileService';
import { useTheme } from '../theme';

export type AppStackParams = BuddyRoutes & {
    AuthStack: undefined;
    OnboardingStack: undefined;
    TabNavigator: undefined;
    NotificationsScreen: undefined;
    PlansStack: NavigatorScreenParams<PlansStackParams> | undefined;
    AccountScreen: undefined;
    /** How-to for an exercise opened from a buddy's plan; the plan creator and Workout tab have their own copies. */
    ExerciseDetailScreen: { exerciseId: string };
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

    // The profile photo is shown on several screens; make sure it caches and is already fetched.
    const photoUrl = profile?.photoUrl ?? null;
    useEffect(() => {
        if (uid && photoUrl) ensurePhotoCacheable(uid, photoUrl).catch(() => undefined);
    }, [uid, photoUrl]);

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
                    <Stack.Screen name="BuddiesScreen" component={BuddiesScreen} options={opts.screen('Buddies')} />
                    {/* Your own card slides up from the Profile header; swipe it down (or X) to put it away. The scanner pushes inside the sheet. */}
                    <Stack.Screen name="CardStack" component={CardStack} options={{ presentation: 'modal', headerShown: false }} />
                    {/* A card is a sheet with an X: it can be brought up from a link, a scan, or the buddies list. */}
                    <Stack.Screen name="BuddyCardScreen" component={BuddyCardScreen} options={({ navigation, route }) => opts.modal(route.params.displayName ?? 'Iron Card', () => <HeaderButton icon={generalIcons.xMark} accessibilityLabel="Close" onPress={() => navigation.goBack()} />)} />
                    <Stack.Screen name="BuddyActivityScreen" component={BuddyActivityScreen} options={opts.screen('Buddy activity')} />
                    <Stack.Screen name="BuddyPlansScreen" component={BuddyPlansScreen} options={opts.screen('Plans from buddies')} />
                    <Stack.Screen name="BuddyPlanScreen" component={BuddyPlanScreen} options={opts.screen('Plan')} />
                    <Stack.Screen name="ExerciseDetailScreen" component={ExerciseDetailScreen} options={({ navigation }) => opts.modal('How to', () => <HeaderButton icon={generalIcons.xMark} accessibilityLabel="Close" onPress={() => navigation.goBack()} />)} />
                </>
            )}
        </Stack.Navigator>
    );
};
