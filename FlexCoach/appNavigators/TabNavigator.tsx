import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { colors } from '../colors';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { IconProp } from '@fortawesome/fontawesome-svg-core';
import { appTabs } from '../config/appTabsConfig';
import { tabIcons } from '../components/icons/icon-library';

export const TabNavigator = () => {
    const Tab = createBottomTabNavigator();
    const appColors = colors();

    return(
    <Tab.Navigator
        screenOptions={() => ({
            headerShown: false,
            tabBarStyle: {backgroundColor: appColors.background},
            tabBarShowLabel: false
        })}
    >
        {appTabs.map((tab, index) => (
            <Tab.Screen
                key={index}
                name={tab.name}
                component={tab.component}
                options={{
                    tabBarIcon: ({focused}) => (
                        <FontAwesomeIcon 
                            icon={tab.icon as IconProp}
                            color={focused ? appColors.accent : appColors.inactive}
                            size={tab.icon === tabIcons.log ? 40 : 25}
                        />
                    )
                }}
            />
        ))}
    </Tab.Navigator>
    );
}