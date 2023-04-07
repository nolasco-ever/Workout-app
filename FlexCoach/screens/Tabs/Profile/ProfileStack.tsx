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

const Stack = createStackNavigator();

export const ProfileStack = () => {
    const appColors = colors();
    return (
        <Stack.Navigator
            screenOptions={{
                headerShown: false
            }}
        >
            {profileStack.map((screen, index) => (
                <Stack.Screen
                    key={index}
                    name={screen.id}
                    component={screen.component}
                    options={index !== 0 ? {
                        headerShown: true,
                        headerStyle: {backgroundColor: appColors.background},
                        headerTitleStyle: {color: appColors.text},
                        headerTitle: screen.name,
                        headerBackTitleVisible: false,
                        headerBackImage: () => (
                            <FontAwesomeIcon
                                icon={directionIcons.angleLeft as IconProp} 
                                color={appColors.icon} 
                                size={30} 
                                style={{marginLeft: 10}}
                            />
                        )
                    } : {}}
                />
            ))}
            <Stack.Screen
                name="placeholderScreen"
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