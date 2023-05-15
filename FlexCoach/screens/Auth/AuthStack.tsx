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

const Stack = createStackNavigator();

export const AuthStack = ({navigation}: {navigation: any}) => {
    const appColors = colors();

    return (
        <Stack.Navigator
            screenOptions={{
                headerShown: false
            }}
        >
            {authStack.map((screen, index) => (
                <Stack.Screen
                    key={index}
                    name={screen.id}
                    component={screen.component}
                    options={index !== 0 ? {
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
                    } : {}}
                />
            ))}
            <Stack.Screen
                name="emailSentScreen"
                component={MessageScreen}
                options={{
                    headerShown: false
                }}
                initialParams={{
                    title: 'Email Sent!',
                    message: 'Check your inbox for instructions on resetting your password',
                    image: emailSentAniamtion,
                    buttonTitle: 'Finish',
                    buttonAction: () => navigation.popToTop()
                }}
            />
        </Stack.Navigator>
    )
}