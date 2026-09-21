import { StyleSheet, Text, View } from 'react-native'
import React from 'react'
import { colors } from '../../colors'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { useStackOptions } from '../../navigation/stackOptions'
import { onboardingStack } from '../../config/onboardingStackConfig';
import { Icon } from '../../components/icons/Icon';
import { directionIcons } from '../../components/icons/icon-library';
import MessageScreen from '../../shared-screens/messageScreen';
import { introScreenAnimation } from '../../animations/onboarding-flow';
import { successCheckAnimation } from '../../animations/shared';
import { UserProfileInfoScreen } from './screens/UserProfileInfoScreen';
import { SetProfilePhotoScreen } from './screens/SetProfilePhotoScreen';
import { DesignYourPlanScreen } from './screens/DesignYourPlanScreen';
export type OnboardingStackParams = {
    WelcomeScreen: {
        title: string;
        message: string;
        image: any;
        imageLoop: boolean;
        buttonTitle: string;
        navigateTo?: string;
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
        replaceWith?: string;
    } | undefined;
}

const Stack = createNativeStackNavigator<OnboardingStackParams>();

export const OnboardingStack = () => {
    const opts = useStackOptions();

    return (
        <Stack.Navigator screenOptions={opts.base}>
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
                    navigateTo: 'UserProfileInfoScreen'
                }}
            />
            <Stack.Screen
                name='UserProfileInfoScreen'
                component={UserProfileInfoScreen}
                options={opts.screen('Create Your Profile')}
            />
            <Stack.Screen
                name='SetProfilePhotoScreen'
                component={SetProfilePhotoScreen}
                options={opts.screen('Set Your Photo')}
            />
            <Stack.Screen
                name='DesignYourPlanScreen'
                component={DesignYourPlanScreen}
                options={opts.screen('Design Your Plan')}
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
                    replaceWith: 'TabNavigator'
                }}
            />
        </Stack.Navigator>
    )
}