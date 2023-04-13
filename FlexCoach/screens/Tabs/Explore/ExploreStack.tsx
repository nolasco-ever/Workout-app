import { StyleSheet, Text, View } from 'react-native'
import React from 'react'
import { createStackNavigator } from '@react-navigation/stack'
import { colors } from '../../../colors';
import { exploreStack } from '../../../config/exploreStackConfig';
import { IconProp } from '@fortawesome/fontawesome-svg-core';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { directionIcons } from '../../../components/icons/icon-library';
import { PlaceholderScreen } from '../../placeholderScreen';

const Stack = createStackNavigator();

export const ExploreStack = () => {
    const appColors = colors();

    return (
        <Stack.Navigator
            screenOptions={{
                headerShown: false
            }}
        >
            {exploreStack.map((screen, index) => (
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
                                size={30} 
                                style={{marginLeft: 10}}
                            />
                        )
                    } : {}}
                />
            ))}
            <Stack.Screen
                name="placeholderScreen"
                component={PlaceholderScreen}
                options={({ route }) => ({
                    headerShown: true,
                    headerStyle: {backgroundColor: appColors.background},
                    headerTitleStyle: {color: appColors.text},
                    headerTitle: (route.params as { title: string }).title,
                    headerBackTitleVisible: false,
                    headerBackImage: () => (
                        <FontAwesomeIcon
                            icon={directionIcons.angleLeft as IconProp} 
                            color={appColors.icon} 
                            size={30} 
                            style={{marginLeft: 10}}
                        />
                    )
                })}
            />
        </Stack.Navigator>
    )
}

const styles = StyleSheet.create({})