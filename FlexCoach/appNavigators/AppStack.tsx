import React from 'react';
import { TransitionPresets, createStackNavigator } from '@react-navigation/stack';
import { SignInScreen } from '../screens/Auth/screens/SignInScreen';
import { TabNavigator } from './TabNavigator';
import { NotificationsScreen } from '../screens/Tabs/Home/screens/NotificationsScreen';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { directionIcons } from '../components/icons/icon-library';
import { IconProp } from '@fortawesome/fontawesome-svg-core';
import { colors } from '../colors';
import { CustomTrainingProgramStack } from '../Flows/create-custom-training-program/CustomTrainingProgramStack';
import { AuthStack } from '../screens/Auth/AuthStack';
import { OnboardingStack } from '../screens/Onboarding/OnboardingStack';

const Stack = createStackNavigator();

export type AppStackParams = {
    SignInStack: undefined;
    OnboardingStack: undefined;
    TabNavigator: undefined;
    NotificationsScreen: undefined;
    CustomTrainingProgramStack: undefined;
}

export const AppStack = () => {
    const appColors = colors();
    return (
        <Stack.Navigator
            screenOptions={{
                headerShown: false
            }}
        >
            <Stack.Screen
                name="SignInStack"
                component={AuthStack}
            />
            <Stack.Screen
                name="OnboardingStack"
                component={OnboardingStack}
            />
            <Stack.Screen
                name="TabNavigator"
                component={TabNavigator}
            />
            <Stack.Screen
                name='NotificationsScreen'
                component={NotificationsScreen}
                options={{
                    headerShown: true,
                    headerStyle: {backgroundColor:  appColors.background},
                    headerTitleStyle: {color: appColors.text},
                    headerBackTitleVisible: false,
                    headerTitle: 'Notifications',
                    headerBackImage: () => (
                        <FontAwesomeIcon
                            icon={directionIcons.angleLeft as IconProp} 
                            color={appColors.icon} 
                            size={25} 
                            style={{marginLeft: 10}}
                        />
                    )
                }}
            />
            <Stack.Screen
                name='CustomTrainingProgramStack'
                component={CustomTrainingProgramStack}
                options={{
                    headerShown: false,
                    ...TransitionPresets.ModalSlideFromBottomIOS
                }}
            />
        </Stack.Navigator>
    );
}