import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import React from 'react'
import { generalIcons } from '../../icons/icon-library'
import { colors } from '../../../colors'
import { Icon } from '../../icons/Icon';
import { NavigationProp, useNavigation } from '@react-navigation/native'
import { AppStackParams } from '../../../appNavigators/AppStack'

export const NotificationButton = () => {
    const appColors = colors();

    const navigation = useNavigation<NavigationProp<AppStackParams, 'NotificationsScreen'>>();
    
    return (
        <TouchableOpacity onPress={() => navigation.navigate('NotificationsScreen')}>
            <Icon
                icon={generalIcons.bell}
                color={appColors.icon}
                size={25}
            />
        </TouchableOpacity>
    )
}