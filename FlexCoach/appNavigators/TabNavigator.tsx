import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { colors } from '../colors';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { tabIcons } from '../components/icons/icon-library';
import { HomeStack } from '../screens/Tabs/Home/HomeStack';
import { ExploreStack } from '../screens/Tabs/Explore/ExploreStack';
import { ProfileStack } from '../screens/Tabs/Profile/ProfileStack';

export type TabNavigatorParams = {
    HomeStack: undefined;
    ExploreStack: undefined;
    ProfileStack: undefined;
}

export const TabNavigator = () => {
    const Tab = createBottomTabNavigator<TabNavigatorParams>();
    const appColors = colors();

    return(
    <Tab.Navigator
        initialRouteName='HomeStack'
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
                    <FontAwesomeIcon 
                        icon={tabIcons.home}
                        color={focused ? appColors.text : appColors.inactive}
                        size={25}
                    />
                )
            }}
        />
        <Tab.Screen
            name='ExploreStack'
            component={ExploreStack}
            options={{
                tabBarIcon: ({focused}) => (
                    <FontAwesomeIcon 
                        icon={tabIcons.explore}
                        color={focused ? appColors.text : appColors.inactive}
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
                    <FontAwesomeIcon 
                        icon={tabIcons.profile}
                        color={focused ? appColors.text : appColors.inactive}
                        size={25}
                    />
                )
            }}
        />
    </Tab.Navigator>
    );
}