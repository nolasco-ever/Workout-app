import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import React from 'react'
import { colors } from '../../../colors'
import { NavigationProp, useNavigation } from '@react-navigation/native';
import { LocalParams } from '../../../appNavigators/AppStack';
import { ProfileTabParams } from '../../../config/profileStackConfig';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { generalIcons } from '../../icons/icon-library';

export const SettingsButton = () => {
    const appColors = colors();

    const navigation = useNavigation<NavigationProp<ProfileTabParams, "Settings">>();

    return (
        <TouchableOpacity onPress={() => navigation.navigate('Settings')}>
            <FontAwesomeIcon
                icon={generalIcons.gear}
                color={appColors.icon}
                size={25}
            />
        </TouchableOpacity>
    )
}

const styles = StyleSheet.create({})