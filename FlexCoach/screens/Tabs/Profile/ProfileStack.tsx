import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ProfileScreen } from './screens/ProfileScreen';
import { HistoryScreen } from './screens/HistoryScreen';
import { SessionDetailScreen } from '../Workout/screens/SessionDetailScreen';
import { PlaceholderScreen } from '../../placeholderScreen';
import { useStackOptions } from '../../../navigation/stackOptions';

export type ProfileStackParams = {
    ProfileScreen: undefined;
    HistoryScreen: undefined;
    SessionDetailScreen: { sessionId: string };
    PlaceholderScreen: { title: string };
};

const Stack = createNativeStackNavigator<ProfileStackParams>();

export const ProfileStack = () => {
    const opts = useStackOptions();
    return (
        <Stack.Navigator screenOptions={opts.base}>
            <Stack.Screen name="ProfileScreen" component={ProfileScreen} options={opts.root('Profile')} />
            <Stack.Screen name="HistoryScreen" component={HistoryScreen} options={opts.screen('History')} />
            <Stack.Screen name="SessionDetailScreen" component={SessionDetailScreen} options={opts.screen('Workout')} />
            <Stack.Screen name="PlaceholderScreen" component={PlaceholderScreen} options={({ route }) => opts.screen(route.params.title)} />
        </Stack.Navigator>
    );
};
