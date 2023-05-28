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

const Stack = createStackNavigator();

export const OnboardingStack = ({navigation}: {navigation: any}) => {
    const appColors = colors();


    return (
        <Stack.Navigator
            screenOptions={{
                headerShown: false
            }}
        >
            <Stack.Screen
                name='welcomeScreen'
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
                    buttonAction: () => navigation.navigate('userProfileInfoScreen')
                }}
            />
            {onboardingStack.map((screen, index) => (
                <Stack.Screen
                    key={index}
                    name={screen.id}
                    component={screen.component}
                    options={{
                        headerShown: true,
                        headerStyle: {backgroundColor: appColors.background},
                        headerTitleStyle: {color: appColors.text},
                        headerTitle: screen.name,
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
            ))}
            <Stack.Screen
                name='successScreen'
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
                    buttonAction: () => navigation.replace('Tabs')
                }}
            />
        </Stack.Navigator>
    )
}