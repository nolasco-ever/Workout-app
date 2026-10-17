import React from 'react';
import { Platform } from 'react-native';
import { createNativeBottomTabNavigator } from '@bottom-tabs/react-navigation';
import { useTheme } from '../theme';
import { HomeStack } from '../screens/Tabs/Home/HomeStack';
import { WorkoutStack } from '../screens/Tabs/Workout/WorkoutStack';
import { ProfileStack } from '../screens/Tabs/Profile/ProfileStack';
import { devFlags } from '../dev/flags';

export type TabNavigatorParams = {
    HomeStack: undefined;
    WorkoutStack: undefined;
    ProfileStack: undefined;
};

const Tab = createNativeBottomTabNavigator<TabNavigatorParams>();

/**
 * Phosphor's regular glyphs, so the tab bar matches the rest of the app: template PNGs on iOS (the native bar tints
 * them, Liquid Glass on iOS 26), vector drawables on Android. Both are drawn from the same Phosphor paths.
 */
const TAB_IMAGES = {
  home: { outline: require('../assets/tabs/home.png'), fill: require('../assets/tabs/home-fill.png') },
  workout: { outline: require('../assets/tabs/workout.png'), fill: require('../assets/tabs/workout-fill.png') },
  profile: { outline: require('../assets/tabs/profile.png'), fill: require('../assets/tabs/profile-fill.png') },
} as const;
/** The chosen tab shows the filled glyph, the others the outline. */
const icon = (name: keyof typeof TAB_IMAGES, drawable: string) => ({ focused }: { focused: boolean }) =>
  Platform.OS === 'ios' ? TAB_IMAGES[name][focused ? 'fill' : 'outline'] : { uri: focused ? `${drawable}_fill` : drawable };

export const TabNavigator = () => {
    const { colors } = useTheme();
    return (
        <Tab.Navigator
            initialRouteName={__DEV__ ? devFlags.startTab : 'HomeStack'}
            tabBarActiveTintColor={colors.accent}
            tabBarInactiveTintColor={colors.inactive}
            tabBarStyle={Platform.OS === 'android' ? { backgroundColor: colors.ground } : undefined}
            translucent
            hapticFeedbackEnabled
            minimizeBehavior="never"
            labeled
        >
            <Tab.Screen name="HomeStack" component={HomeStack} options={{ title: 'Home', tabBarIcon: icon('home', 'ic_tab_home') }} />
            <Tab.Screen name="WorkoutStack" component={WorkoutStack} options={{ title: 'Workout', tabBarIcon: icon('workout', 'ic_tab_workout') }} />
            <Tab.Screen name="ProfileStack" component={ProfileStack} options={{ title: 'Profile', tabBarIcon: icon('profile', 'ic_tab_profile') }} />
        </Tab.Navigator>
    );
};
