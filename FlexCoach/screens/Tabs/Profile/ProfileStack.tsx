import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { Icon } from '../../../components/icons/Icon';
import { colors } from '../../../colors';
import { ProfileScreen } from './screens/ProfileScreen';
import { directionIcons } from '../../../components/icons/icon-library';
import { profileStack } from '../../../config/profileStackConfig';
import { PlaceholderScreen } from '../../placeholderScreen';
import { NavigationHeader } from '../../../components/headers/NavigationHeader';
import { getScreenHeaderOptions } from '../../../config/getScreenHeader';
import { AppThemeScreen } from './screens/AppThemeScreen';

export type ProfileStackParams = {
    ProfileScreen: undefined;
    AppThemeScreen: undefined;
    PlaceholderScreen: { title: string };
}

const Stack = createStackNavigator<ProfileStackParams>();

export const ProfileStack = () => {
    const appColors = colors();

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
                        />
                    )
                }}
            />
            <Stack.Screen
                name='AppThemeScreen'
                component={AppThemeScreen}
                options={{
                    headerBackImage: () => (
                        <Icon
                            icon={directionIcons.angleLeft} 
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
                    headerBackTitle: '',
                    headerBackImage: () => (
                        <Icon
                            icon={directionIcons.angleLeft} 
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