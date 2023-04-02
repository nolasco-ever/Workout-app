import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { SignInScreen } from '../screens/Auth/SignInScreen';
import { TabNavigator } from './TabNavigator';
import { NotificationsScreen } from '../screens/Tabs/Home/NotificationsScreen';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { directionIcons } from '../components/icons/icon-library';
import { IconProp } from '@fortawesome/fontawesome-svg-core';
import { colors } from '../colors';

const Stack = createStackNavigator();

export const AppStack = () => {
    const appColors = colors();
    return (
        <Stack.Navigator
            screenOptions={{
                headerShown: false
            }}
        >
            <Stack.Screen
                name="SignIn"
                component={SignInScreen}
            />
            <Stack.Screen
                name="Tabs"
                component={TabNavigator}
            />
            <Stack.Screen
                name='Notifications'
                component={NotificationsScreen}
                options={{
                    headerShown: true,
                    headerTransparent: true,
                    headerBackTitleVisible: false,
                    headerTitle: '',
                    headerBackImage: () => (
                        <FontAwesomeIcon
                            icon={directionIcons.angleLeft as IconProp} 
                            color={appColors.icon} 
                            size={30} 
                            style={{marginLeft: 10}}
                        />
                    )
                }}
            />
        </Stack.Navigator>
    );
}