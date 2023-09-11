import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import React from 'react'
import { colors } from '../../../colors'
import { NavigationProp, useNavigation } from '@react-navigation/native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { generalIcons } from '../../icons/icon-library';
import { ProfileTabParams } from '../../../screens/Tabs/Profile/ProfileStack';

export const SettingsButton = () => {
    const appColors = colors();

    const navigation = useNavigation<NavigationProp<ProfileTabParams, "SettingsScreen">>();

    return (
        <TouchableOpacity onPress={() => navigation.navigate('SettingsScreen')}>
            <FontAwesomeIcon
                icon={generalIcons.gear}
                color={appColors.icon}
                size={25}
            />
        </TouchableOpacity>
    )
}

const styles = StyleSheet.create({})