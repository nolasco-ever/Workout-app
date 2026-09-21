import React from 'react';
import { TransitionPresets, createStackNavigator } from '@react-navigation/stack';
import { SignInScreen } from '../screens/Auth/screens/SignInScreen';
import { TabNavigator } from './TabNavigator';
import { NotificationsScreen } from '../screens/Tabs/Home/screens/NotificationsScreen';
import { Icon } from '../components/icons/Icon';
import { directionIcons } from '../components/icons/icon-library';
import { colors } from '../colors';
import { PlansStack } from '../screens/Plans/PlansStack';
import { AuthStack } from '../screens/Auth/AuthStack';
import { OnboardingStack } from '../screens/Onboarding/OnboardingStack';
import { devFlags } from '../dev/flags';

const Stack = createStackNavigator();

export type AppStackParams = {
    SignInStack: undefined;
    OnboardingStack: undefined;
    TabNavigator: undefined;
    NotificationsScreen: undefined;
    PlansStack: undefined;
}

export const AppStack = () => {
    const appColors = colors();
    return (
        <Stack.Navigator
            initialRouteName={__DEV__ && devFlags.startAtTabs ? 'TabNavigator' : 'SignInStack'}
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
                    headerBackTitle: '',
                    headerTitle: 'Notifications',
                    headerBackImage: () => (
                        <Icon
                            icon={directionIcons.angleLeft} 
                            color={appColors.icon} 
                            size={25} 
                            style={{marginLeft: 10}}
                        />
                    )
                }}
            />
            <Stack.Screen
                name='PlansStack'
                component={PlansStack}
                options={{
                    headerShown: false,
                    ...TransitionPresets.ModalSlideFromBottomIOS
                }}
            />
        </Stack.Navigator>
    );
}