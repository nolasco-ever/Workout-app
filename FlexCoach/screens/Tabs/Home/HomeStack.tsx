import React, { useEffect, useState } from 'react'
import { createStackNavigator } from '@react-navigation/stack'
import { colors } from '../../../colors';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { directionIcons, generalIcons } from '../../../components/icons/icon-library';
import { IconProp } from '@fortawesome/fontawesome-svg-core';
import { PlaceholderScreen } from '../../placeholderScreen';
import { AddDietEntryScreen } from './screens/AddDietEntryScreen';
import { getScreenHeaderOptions } from '../../../config/getScreenHeader';
import { NavigationHeader } from '../../../components/headers/NavigationHeader';
import { NotificationButton } from '../../../components/headers/HeaderActionButtons/NotificationButton';
import { HomeScreen } from './screens/HomeScreen';
import { WorkoutHub } from './screens/WorkoutHub';
import WorkoutLoggerScreen from './screens/WorkoutLoggerScreen';
import { DietLogScreen } from './screens/DietLogScreen';
import { WorkoutOverviewScreen } from './screens/WorkoutOverviewScreen';
import { WorkoutProgressScreen } from './screens/WorkoutProgressScreen';

export type HomeStackParams = {
    HomeScreen: undefined;
    WorkoutHubScreen: undefined;
    WorkoutOverviewScreen: undefined;
    WorkoutProgressScreen: undefined;
    WorkoutLoggerScreen: { exercise: any, completed?: any };
    DietLogScreen: undefined;
    AddDietEntryScreen: undefined;
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
                name="WorkoutOverviewScreen"
                component={WorkoutOverviewScreen}
                options={{
                    headerBackImage: () => (
                        <FontAwesomeIcon
                            icon={directionIcons.angleLeft as IconProp}
                            color={appColors.icon}
                            size={25}
                            style={{marginLeft: 10}}
                        />
                    ),
                    ...getScreenHeaderOptions(appColors, `Workout Overview`)
                }}
            />
            <Stack.Screen
                name="WorkoutProgressScreen"
                component={WorkoutProgressScreen}
                options={{
                    headerBackImage: () => (
                        <FontAwesomeIcon
                            icon={directionIcons.angleLeft as IconProp}
                            color={appColors.icon}
                            size={25}
                            style={{marginLeft: 10}}
                        />
                    ),
                    ...getScreenHeaderOptions(appColors, `Workout Progress`)
                }}
            />
            <Stack.Screen
                name="WorkoutLoggerScreen"
                component={WorkoutLoggerScreen}
                options={{
                    headerBackImage: () => (
                        <FontAwesomeIcon
                            icon={directionIcons.angleLeft as IconProp}
                            color={appColors.icon}
                            size={25}
                            style={{marginLeft: 10}}
                        />
                    ),
                    ...getScreenHeaderOptions(appColors, 'Workout Logger')
                }}
            />
            <Stack.Screen
                name="DietLogScreen"
                component={DietLogScreen}
                options={{
                    headerBackImage: () => (
                        <FontAwesomeIcon
                            icon={directionIcons.angleLeft as IconProp}
                            color={appColors.icon}
                            size={25}
                            style={{marginLeft: 10}}
                        />
                    ),
                    ...getScreenHeaderOptions(appColors, 'Diet Log')
                }}
            />
            <Stack.Screen
                name="AddDietEntryScreen"
                component={AddDietEntryScreen}
                options={{
                    presentation: 'modal',
                    headerBackImage: () => (
                        <FontAwesomeIcon
                            icon={generalIcons.xMark as IconProp}
                            color={appColors.icon}
                            size={25}
                            style={{marginLeft: 10}}
                        />
                    ),
                    ...getScreenHeaderOptions(appColors, 'Record Meal')
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