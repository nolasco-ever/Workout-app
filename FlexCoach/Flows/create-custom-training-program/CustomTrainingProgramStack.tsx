import React from 'react'
import { createStackNavigator } from "@react-navigation/stack";
import { colors } from "../../colors";
import { customTrainingProgramStack } from '../../config/customTrainingProgramStackConfig';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { directionIcons } from '../../components/icons/icon-library';
import { IconProp } from '@fortawesome/fontawesome-svg-core';

const Stack = createStackNavigator();

export const CustomTrainingProgramStack = () => {
    const appColors = colors();

    return (
        <Stack.Navigator
            screenOptions={{
                headerShown: false
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
                        headerBackImage: () => (
                            <FontAwesomeIcon
                                icon={directionIcons.angleLeft as IconProp}
                                color={appColors.icon}
                                size={30}
                                style={{marginLeft: 10}}
                            />
                        )
                    }}
                />
            ))}
        </Stack.Navigator>
    );
}