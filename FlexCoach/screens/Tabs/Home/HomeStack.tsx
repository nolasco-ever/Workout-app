import React, { useEffect, useState } from 'react'
import { createStackNavigator } from '@react-navigation/stack'
import { colors } from '../../../colors';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { directionIcons, generalIcons } from '../../../components/icons/icon-library';
import { IconProp } from '@fortawesome/fontawesome-svg-core';
import { PlaceholderScreen } from '../../placeholderScreen';
import { homeStack } from '../../../config/homeStackConfig';
import { AddDietEntryScreen } from './screens/AddDietEntryScreen';
import { getScreenHeaderOptions } from '../../../config/getScreenHeader';
import { NavigationHeader } from '../../../components/headers/NavigationHeader';
import { NotificationButton } from '../../../components/headers/HeaderActionButtons/NotificationButton';
import { HomeScreen } from './screens/HomeScreen';

const Stack = createStackNavigator();

export const HomeStack = () => {
    const appColors = colors();

    const navigationButtons = [
        <NotificationButton key="notificationsButton"/>
    ]

    return (
        <Stack.Navigator>
            <Stack.Screen
                name='homeScreen'
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
            {homeStack.slice(1,).flatMap((screen, index) => (
                <Stack.Screen
                    key={index}
                    name={screen.id}
                    component={screen.component}
                    options={{
                        headerBackImage: () => (
                            <FontAwesomeIcon
                                icon={directionIcons.angleLeft as IconProp}
                                color={appColors.icon}
                                size={25}
                                style={{marginLeft: 10}}
                            />
                        ),
                        ...getScreenHeaderOptions({appColors, screen})
                    }}
                />
            ))}
            <Stack.Screen
                name="addDietEntryScreen"
                component={AddDietEntryScreen}
                options={{
                    presentation: 'modal',
                    headerShown: true,
                    headerStyle: {backgroundColor: appColors.background},
                    headerTitleStyle: {color: appColors.text},
                    headerTitle: 'Record Meal',
                    headerBackTitleVisible: false,
                    headerBackImage: () => (
                        <FontAwesomeIcon
                            icon={generalIcons.xMark as IconProp}
                            color={appColors.icon}
                            size={25}
                            style={{marginLeft: 10}}
                        />
                    )
                }}
            />
            <Stack.Screen
                name="placeholderScreen"
                component={PlaceholderScreen}
                options={({route}) => ({
                    headerShown: true,
                    headerStyle: {backgroundColor: appColors.background},
                    headerTitleStyle: {color: appColors.text},
                    headerTitle: (route.params as { title: string }).title,
                    headerBackTitleVisible: false,
                    headerBackImage: () => (
                        <FontAwesomeIcon
                            icon={directionIcons.angleLeft as IconProp}
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