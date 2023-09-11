import { StyleSheet, Text, View } from 'react-native'
import React, { useState } from 'react'
import { createStackNavigator } from '@react-navigation/stack'
import { colors } from '../../../colors';
import { exploreStack } from '../../../config/exploreStackConfig';
import { IconProp } from '@fortawesome/fontawesome-svg-core';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { directionIcons, generalIcons } from '../../../components/icons/icon-library';
import { PlaceholderScreen } from '../../placeholderScreen';
import { ArticleScreen } from '../../../shared-screens/articleScreen';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { ExploreScreen } from './screens/ExploreScreen';
import { NavigationHeader } from '../../../components/headers/NavigationHeader';
import { TutorialScreen } from '../../../shared-screens/tutorialScreen';
import { getScreenHeaderOptions } from '../../../config/getScreenHeader';

type exercisesArrayType = {
    name: string;
    link: string;
    howToSteps: string[];
}[]

export type ExploreStackParams = {
    ExploreScreen: undefined;
    TutorialScreen: ({ title: string, videoLink: string, steps: string[], muscleGroupWorkouts: exercisesArrayType });
    ArticleScreen: ({ articleData: any });
    PlaceholderScreen: { title: string };
}

const Stack = createStackNavigator<ExploreStackParams>();

export const ExploreStack = () => {
    const appColors = colors();

    return (
        <Stack.Navigator>
            <Stack.Screen
                name="ExploreScreen"
                component={ExploreScreen}
                options={{
                    header: () => (
                        <NavigationHeader
                            title="Explore"
                        />
                    )
                }}
            />
            <Stack.Screen
                name="TutorialScreen"
                component={TutorialScreen}
                options={{
                    headerShown: true,
                    headerStyle: {backgroundColor: appColors.background},
                    headerTitleStyle: {color: appColors.text, marginLeft: 10, marginRight: 10, fontSize: 16},
                    headerTitle: "Tutorial",
                    headerBackTitleVisible: false,
                    headerBackImage: () => (
                        <FontAwesomeIcon
                            icon={directionIcons.angleLeft as IconProp} 
                            color={appColors.icon} 
                            size={25} 
                            style={{marginLeft: 10}}
                        />
                    ),
                    headerRight: () => {
                        const [bookmarked, setBookmarked] = useState<boolean>();

                        return (
                            <TouchableOpacity onPress={() => setBookmarked(prev => !prev)}>
                                <FontAwesomeIcon
                                    icon={bookmarked ? generalIcons.bookmarkFilled : generalIcons.bookmarkOutline}
                                    color={appColors.icon}
                                    size={25}
                                    style={{marginRight: 10}}
                                />
                            </TouchableOpacity>
                        )
                    }
                }}
            />
            <Stack.Screen
                name="ArticleScreen"
                component={ArticleScreen}
                options={({ route }) => ({
                    headerShown: true,
                    headerStyle: {backgroundColor: appColors.background},
                    headerTitleStyle: {color: appColors.text, marginLeft: 10, marginRight: 10, fontSize: 16},
                    headerTitle: (route.params as { articleData: any }).articleData.title,
                    headerBackTitleVisible: false,
                    headerBackImage: () => (
                        <FontAwesomeIcon
                            icon={directionIcons.angleLeft as IconProp} 
                            color={appColors.icon} 
                            size={25} 
                            style={{marginLeft: 10}}
                        />
                    ),
                    headerRight: () => {
                        const [bookmarked, setBookmarked] = useState<boolean>();

                        return (
                            <TouchableOpacity onPress={() => setBookmarked(prev => !prev)}>
                                <FontAwesomeIcon
                                    icon={bookmarked ? generalIcons.bookmarkFilled : generalIcons.bookmarkOutline}
                                    color={appColors.icon}
                                    size={25}
                                    style={{marginRight: 10}}
                                />
                            </TouchableOpacity>
                        )
                    }
                })}
            />
            <Stack.Screen
                name="PlaceholderScreen"
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