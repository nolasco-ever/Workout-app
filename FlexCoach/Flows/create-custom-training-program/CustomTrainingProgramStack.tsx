import React from 'react'
import { createStackNavigator } from "@react-navigation/stack";
import { colors } from "../../colors";
import { customTrainingProgramStack } from '../../config/customTrainingProgramStackConfig';
import { Icon } from '../../components/icons/Icon';
import { directionIcons, generalIcons } from '../../components/icons/icon-library';
import { TutorialScreen } from '../../shared-screens/tutorialScreen';
import MessageScreen from '../../shared-screens/messageScreen';
import { successCheckAnimation } from '../../animations/shared';

type exercisesArrayType = {
    name: string;
    link: string;
    howToSteps: string[];
}[]

export interface CustomTrainingProgramStackParams {
    SetFitnessGoalsScreen: undefined;
    SelectWorkoutsScreen: undefined;
    ScheduleTrainingProgramScreen: ({ items: string[] });
    ReviewYourProgramScreen: ({ workoutItems: string[][], numOfWeeks: number });
    TutorialScreen: ({ title: string, videoLink: string, steps: string[], muscleGroupWorkouts: exercisesArrayType });
    SuccessScreen: undefined;
}

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
                        headerBackTitle: '',
                        headerBackImage: () => index === 0 ? (
                            <Icon
                                icon={generalIcons.xMark}
                                color={appColors.icon}
                                size={25}
                                style={{marginLeft: 10}}
                            />
                        ) : (
                            <Icon
                                icon={directionIcons.angleLeft}
                                color={appColors.icon}
                                size={25}
                                style={{marginLeft: 10}}
                            />
                        )
                    }}
                />
            ))}
            <Stack.Screen
                name="TutorialScreen"
                component={TutorialScreen}
                options={{
                    presentation: 'modal',
                    headerShown: true,
                    headerStyle: {backgroundColor: appColors.background},
                    headerTitleStyle: {color: appColors.text},
                    headerTitle: 'Tutorial Screen',
                    headerBackTitle: '',
                    headerBackImage: () => (
                        <Icon
                            icon={generalIcons.xMark}
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