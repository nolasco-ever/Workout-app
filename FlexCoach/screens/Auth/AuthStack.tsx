import { StyleSheet, Text, View } from 'react-native'
import React from 'react'
import { TransitionPresets, createStackNavigator } from '@react-navigation/stack'
import { colors } from '../../colors';
import { authStack } from '../../config/authStackConfig';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { directionIcons, generalIcons } from '../../components/icons/icon-library';
import { IconProp } from '@fortawesome/fontawesome-svg-core';
import MessageScreen from '../../shared-screens/messageScreen';
import { emailSentAniamtion } from '../../animations/auth-flow';
import { NavigationProp, StackActions, useNavigation } from '@react-navigation/native';
import { SignInScreen } from './screens/SignInScreen';
import { SignUpScreen } from './screens/SignUpScreen';
import { ForgotPasswordScreen } from './screens/ForgotPasswordScreen';

export type AuthStackParams = {
    SignInScreen: undefined;
    SignUpScreen: undefined;
    ForgotPasswordScreen: undefined;
    EmailSentScreen: {
        title: string;
        message: string;
        image: any;
        buttonTitle: string;
        buttonAction: () => void;
    } | undefined;
}

const Stack = createStackNavigator<AuthStackParams>();

export const AuthStack = () => {
    const navigation = useNavigation<NavigationProp<AuthStackParams>>();

    const appColors = colors();

    return (
        <Stack.Navigator initialRouteName="SignInScreen">
            <Stack.Screen
                name="SignInScreen"
                component={SignInScreen}
                options={{headerShown: false}}
            />
            <Stack.Screen
                name="SignUpScreen"
                component={SignUpScreen}
                options={{
                    headerShown: true,
                    headerStyle: {backgroundColor: appColors.background},
                    headerTitleStyle: {color: appColors.text},
                    headerTitle: 'Sign Up',
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
                name="ForgotPasswordScreen"
                component={ForgotPasswordScreen}
                options={{
                    headerShown: true,
                    headerStyle: {backgroundColor: appColors.background},
                    headerTitleStyle: {color: appColors.text},
                    headerTitle: 'Reset Your Password',
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
                name="EmailSentScreen"
                component={MessageScreen}
                options={{
                    headerShown: false
                }}
                initialParams={{
                    title: 'Email Sent!',
                    message: 'Check your inbox for instructions on resetting your password',
                    image: emailSentAniamtion,
                    buttonTitle: 'Finish',
                    buttonAction: () => navigation.dispatch(StackActions.popToTop())
                }}
            />
        </Stack.Navigator>
    )
}