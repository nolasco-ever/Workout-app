import { StyleSheet, Text, View } from 'react-native'
import React from 'react'
import { colors } from '../../colors'
import { createStackNavigator } from '@react-navigation/stack'
import { onboardingStack } from '../../config/onboardingStackConfig';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { directionIcons } from '../../components/icons/icon-library';
import { IconProp } from '@fortawesome/fontawesome-svg-core';
import MessageScreen from '../../shared-screens/messageScreen';
import { introScreenAnimation } from '../../animations/onboarding-flow';
import { successCheckAnimation } from '../../animations/shared';
import { UserProfileInfoScreen } from './screens/UserProfileInfoScreen';
import { SetProfilePhotoScreen } from './screens/SetProfilePhotoScreen';
import { DesignYourPlanScreen } from './screens/DesignYourPlanScreen';
import { NavigationProp, StackActions, useNavigation } from '@react-navigation/native';

export type OnboardingStackParams = {
    WelcomeScreen: {
        title: string;
        message: string;
        image: any;
        imageLoop: boolean;
        buttonTitle: string;
        buttonAction: () => void;
    } | undefined;
    UserProfileInfoScreen: undefined;
    SetProfilePhotoScreen: undefined;
    DesignYourPlanScreen: undefined;
    SuccessScreen: {
        title: string;
        message: string;
        image: any;
        imageLoop: boolean;
        buttonTitle: string;
        buttonAction: () => void;
    } | undefined;
}

const Stack = createStackNavigator<OnboardingStackParams>();

export const OnboardingStack = () => {
    const navigation = useNavigation<NavigationProp<OnboardingStackParams>>();

    const appColors = colors();


    return (
        <Stack.Navigator>
            <Stack.Screen
                name='WelcomeScreen'
                component={MessageScreen}
                options={{
                    headerShown: false
                }}
                initialParams={{
                    title: 'Welcome to FlexCoach!',
                    message: `Our quick and easy onboarding process will get you started in no time.\n\nSimply create your profile, set your fitness goals, and let us do the rest.\n\nLet's get started!`,
                    image: introScreenAnimation,
                    imageLoop: true,
                    buttonTitle: 'Start',
                    buttonAction: () => navigation.navigate('UserProfileInfoScreen')
                }}
            />
            <Stack.Screen
                name='UserProfileInfoScreen'
                component={UserProfileInfoScreen}
                options={{
                    headerShown: true,
                    headerStyle: {backgroundColor: appColors.background},
                    headerTitleStyle: {color: appColors.text},
                    headerTitle: "Create Your Profile",
                    headerBackTitleVisible: false,
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
                name='SetProfilePhotoScreen'
                component={SetProfilePhotoScreen}
                options={{
                    headerShown: true,
                    headerStyle: {backgroundColor: appColors.background},
                    headerTitleStyle: {color: appColors.text},
                    headerTitle: "Set Your Photo",
                    headerBackTitleVisible: false,
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
                name='DesignYourPlanScreen'
                component={DesignYourPlanScreen}
                options={{
                    headerShown: true,
                    headerStyle: {backgroundColor: appColors.background},
                    headerTitleStyle: {color: appColors.text},
                    headerTitle: "Design Your Plan",
                    headerBackTitleVisible: false,
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
                name='SuccessScreen'
                component={MessageScreen}
                options={{
                    headerShown: false
                }}
                initialParams={{
                    title: "Congratulations! You're All Set!",
                    message: "Get ready to embark on a transformative experience as you take charge of your health and well-being.",
                    image: successCheckAnimation,
                    imageLoop: false,
                    buttonTitle: 'Finish',
                    buttonAction: () => navigation.dispatch(StackActions.replace('TabNavigator'))
                }}
            />
        </Stack.Navigator>
    )
}