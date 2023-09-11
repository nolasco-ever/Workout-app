import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { IconProp } from '@fortawesome/fontawesome-svg-core';
import { colors } from '../../../colors';
import { ProfileScreen } from './screens/ProfileScreen';
import { SettingsScreen } from './screens/SettingsScreen';
import { directionIcons } from '../../../components/icons/icon-library';
import { profileStack } from '../../../config/profileStackConfig';
import { PlaceholderScreen } from '../../placeholderScreen';
import { NavigationHeader } from '../../../components/headers/NavigationHeader';
import { SettingsButton } from '../../../components/headers/HeaderActionButtons/SettingsButton';
import { getScreenHeaderOptions } from '../../../config/getScreenHeader';
import { AppThemeScreen } from './screens/AppThemeScreen';

export type ProfileStackParams = {
    ProfileScreen: undefined;
    SettingsScreen: undefined;
    AppThemeScreen: undefined;
    PlaceholderScreen: { title: string };
}

const Stack = createStackNavigator<ProfileStackParams>();

export const ProfileStack = () => {
    const appColors = colors();

    const navigationButtons = [
        <SettingsButton key="settingsButton" />
    ]

    return (
        <Stack.Navigator>
            <Stack.Screen
                name='ProfileScreen'
                component={ProfileScreen}
                options={{
                    header: () => (
                        <NavigationHeader
                            title='Profile'
                            subtitle='Ever Nolasco'
                            navigationButtons={navigationButtons}
                        />
                    )
                }}
            />
            <Stack.Screen
                name='SettingsScreen'
                component={SettingsScreen}
                options={{
                    headerBackImage: () => (
                        <FontAwesomeIcon
                            icon={directionIcons.angleLeft as IconProp} 
                            color={appColors.icon} 
                            size={30} 
                            style={{marginLeft: 10}}
                        />
                    ),
                    ...getScreenHeaderOptions(appColors, 'Settings')
                }}
            />
            <Stack.Screen
                name='AppThemeScreen'
                component={AppThemeScreen}
                options={{
                    headerBackImage: () => (
                        <FontAwesomeIcon
                            icon={directionIcons.angleLeft as IconProp} 
                            color={appColors.icon} 
                            size={30} 
                            style={{marginLeft: 10}}
                        />
                    ),
                    ...getScreenHeaderOptions(appColors, 'App Theme')
                }}
            />
            <Stack.Screen
                name="PlaceholderScreen"
                component={PlaceholderScreen}
                options={({ route }) => ({
                    headerShown: true,
                    headerStyle: {backgroundColor: appColors.background},
                    headerTitleStyle: {color: appColors.text},
                    headerTitle: (route.params as { title: string }).title,
                    headerBackTitleVisible: false,
                    headerBackImage: () => (
                        <FontAwesomeIcon
                            icon={directionIcons.angleLeft as IconProp} 
                            color={appColors.icon} 
                            size={30} 
                            style={{marginLeft: 10}}
                        />
                    )
                })}
            />
        </Stack.Navigator>
    );
}