import React from 'react'
import { createStackNavigator } from "@react-navigation/stack";
import { colors } from "../../colors";
import { customTrainingProgramStack } from '../../config/customTrainingProgramStackConfig';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { directionIcons, generalIcons } from '../../components/icons/icon-library';
import { IconProp } from '@fortawesome/fontawesome-svg-core';
import { TutorialScreen } from '../../shared-screens/tutorialScreen';
import MessageScreen from '../../shared-screens/messageScreen';
import { successCheckAnimation } from '../../animations/shared';

const Stack = createStackNavigator();

export const CustomTrainingProgramStack = () => {
    const appColors = colors();

    return (
        <Stack.Navigator
            screenOptions={{
                headerShown: false,
            }}
        >
            {customTrainingProgramStack.map((screen, index) => (
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
                        headerBackImage: () => index === 0 ? (
                            <FontAwesomeIcon
                                icon={generalIcons.xMark}
                                color={appColors.icon}
                                size={25}
                                style={{marginLeft: 10}}
                            />
                        ) : (
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
                name="tutorialScreen"
                component={TutorialScreen}
                options={{
                    presentation: 'modal',
                    headerShown: true,
                    headerStyle: {backgroundColor: appColors.background},
                    headerTitleStyle: {color: appColors.text},
                    headerTitle: 'Tutorial Screen',
                    headerBackTitleVisible: false,
                    headerBackImage: () => (
                        <FontAwesomeIcon
                            icon={generalIcons.xMark as IconProp}
                            color={appColors.icon}
                            size={25}
                            style={{marginLeft: 10}}
                        />
                    )
                }}
            />
            <Stack.Screen
                name="successScreen"
                component={MessageScreen}
                options={{
                    headerShown: false,
                }}
                initialParams={{
                    title: 'Congrats!',
                    message: 'Your training program has been successfully created. Get ready to crush your fitness goals!',
                    image: successCheckAnimation,
                    buttonTitle: 'Finish'
                }}
            />
        </Stack.Navigator>
    );
}