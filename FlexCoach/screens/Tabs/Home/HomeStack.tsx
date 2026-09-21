import React from 'react'
import { createStackNavigator } from '@react-navigation/stack'
import { colors } from '../../../colors';
import { Icon } from '../../../components/icons/Icon';
import { directionIcons } from '../../../components/icons/icon-library';
import { PlaceholderScreen } from '../../placeholderScreen';
import { NavigationHeader } from '../../../components/headers/NavigationHeader';
import { NotificationButton } from '../../../components/headers/HeaderActionButtons/NotificationButton';
import { HomeScreen } from './screens/HomeScreen';

export type HomeStackParams = {
    HomeScreen: undefined;
    PlaceholderScreen: { title: string };
}

const Stack = createStackNavigator<HomeStackParams>();

export const HomeStack = () => {
    const appColors = colors();

    const navigationButtons = [
        <NotificationButton key="notificationsButton"/>
    ]

    return (
        <Stack.Navigator>
            <Stack.Screen
                name='HomeScreen'
                component={HomeScreen}
                options={{
                    header: () => (
                        <NavigationHeader
                            title="Home"
                            subtitle='Thu, September 20'
                            navigationButtons={navigationButtons}
                        />
                    )
                }}
            />
            <Stack.Screen
                name="PlaceholderScreen"
                component={PlaceholderScreen}
                options={({route}) => ({
                    headerShown: true,
                    headerStyle: {backgroundColor: appColors.background},
                    headerTitleStyle: {color: appColors.text},
                    headerTitle: (route.params as { title: string }).title,
                    headerBackTitle: '',
                    headerBackImage: () => (
                        <Icon
                            icon={directionIcons.angleLeft}
                            color={appColors.icon}
                            size={25}
                            style={{marginLeft: 10}}
                        />
                    )
                })}
            />
        </Stack.Navigator>
    )
}
