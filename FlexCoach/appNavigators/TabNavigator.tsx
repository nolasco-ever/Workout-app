import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { colors } from '../colors';
import { Icon } from '../components/icons/Icon';
import { tabIcons } from '../components/icons/icon-library';
import { HomeStack } from '../screens/Tabs/Home/HomeStack';
import { WorkoutStack } from '../screens/Tabs/Workout/WorkoutStack';
import { devFlags } from '../dev/flags';
import { ProfileStack } from '../screens/Tabs/Profile/ProfileStack';

export type TabNavigatorParams = {
    HomeStack: undefined;
    WorkoutStack: undefined;
    ProfileStack: undefined;
}

export const TabNavigator = () => {
    const Tab = createBottomTabNavigator<TabNavigatorParams>();
    const appColors = colors();

    return(
    <Tab.Navigator
        initialRouteName={__DEV__ ? devFlags.startTab : 'HomeStack'}
        screenOptions={() => ({
            headerShown: false,
            tabBarStyle: {backgroundColor: appColors.background},
            tabBarShowLabel: false
        })}
    >
        <Tab.Screen
            name='HomeStack'
            component={HomeStack}
            options={{
                tabBarIcon: ({focused}) => (
                    <Icon 
                        icon={tabIcons.home}
                        color={focused ? appColors.accent : appColors.inactive}
                        size={25}
                    />
                )
            }}
        />
        <Tab.Screen
            name='WorkoutStack'
            component={WorkoutStack}
            options={{
                tabBarIcon: ({focused}) => (
                    <Icon 
                        icon={tabIcons.workout}
                        color={focused ? appColors.accent : appColors.inactive}
                        size={25}
                    />
                )
            }}
        />
        <Tab.Screen
            name='ProfileStack'
            component={ProfileStack}
            options={{
                tabBarIcon: ({focused}) => (
                    <Icon 
                        icon={tabIcons.profile}
                        color={focused ? appColors.accent : appColors.inactive}
                        size={25}
                    />
                )
            }}
        />
    </Tab.Navigator>
    );
}