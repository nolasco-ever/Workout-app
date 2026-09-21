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

/** SF Symbols on iOS (Liquid Glass on iOS 26); Lucide vector drawables on Android. */
const icon = (sfSymbol: 'house' | 'dumbbell' | 'person', drawable: string) => () => (Platform.OS === 'ios' ? { sfSymbol } : { uri: drawable });

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
            <Tab.Screen name="HomeStack" component={HomeStack} options={{ title: 'Home', tabBarIcon: icon('house', 'ic_tab_home') }} />
            <Tab.Screen name="WorkoutStack" component={WorkoutStack} options={{ title: 'Workout', tabBarIcon: icon('dumbbell', 'ic_tab_workout') }} />
            <Tab.Screen name="ProfileStack" component={ProfileStack} options={{ title: 'Profile', tabBarIcon: icon('person', 'ic_tab_profile') }} />
        </Tab.Navigator>
    );
};
