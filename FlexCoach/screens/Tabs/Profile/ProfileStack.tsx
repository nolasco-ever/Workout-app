import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ProfileScreen } from './screens/ProfileScreen';
import { useStackOptions } from '../../../navigation/stackOptions';

/**
 * Only the Profile tab itself. Everything it opens (History, Notifications,
 * What buddies see, Account, Units, Privacy, Contact us, plans) is on the
 * root stack, so those screens cover the tab bar (owner, 2026-11-14).
 */
export type ProfileStackParams = {
    ProfileScreen: undefined;
};

const Stack = createNativeStackNavigator<ProfileStackParams>();

export const ProfileStack = () => {
    const opts = useStackOptions();
    return (
        <Stack.Navigator screenOptions={opts.base}>
            <Stack.Screen name="ProfileScreen" component={ProfileScreen} options={opts.tabRoot('Profile')} />
        </Stack.Navigator>
    );
};
