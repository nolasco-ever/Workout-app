import { StyleSheet, Text, View } from 'react-native'
import React from 'react'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { useStackOptions } from '../../navigation/stackOptions'
import { colors } from '../../colors';
import { authStack } from '../../config/authStackConfig';
import { Icon } from '../../components/icons/Icon';
import { directionIcons, generalIcons } from '../../components/icons/icon-library';
import MessageScreen from '../../shared-screens/messageScreen';
import { emailSentAniamtion } from '../../animations/auth-flow';
import { NavigationProp } from '@react-navigation/native';
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
        buttonAction?: () => void;
        popToTop?: boolean;
    } | undefined;
}

const Stack = createNativeStackNavigator<AuthStackParams>();

export const AuthStack = () => {
    const opts = useStackOptions();
    return (
        <Stack.Navigator initialRouteName="SignInScreen" screenOptions={opts.base}>
            <Stack.Screen
                name="SignInScreen"
                component={SignInScreen}
                options={{headerShown: false}}
            />
            <Stack.Screen
                name="SignUpScreen"
                component={SignUpScreen}
                options={opts.screen('Sign Up')}
            />
            <Stack.Screen
                name="ForgotPasswordScreen"
                component={ForgotPasswordScreen}
                options={opts.screen('Reset Your Password')}
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
                    popToTop: true
                }}
            />
        </Stack.Navigator>
    )
}