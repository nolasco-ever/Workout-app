import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import React from 'react';
import { colors } from '../../colors';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { generalIcons } from '../icons/icon-library';
import { IconProp } from '@fortawesome/fontawesome-svg-core';

interface IconButtonProps {
    icon: IconProp;
    iconColor?: string;
    label?: string;
    onPress: () => void;
}

export const IconButton = ({
    icon,
    iconColor,
    label,
    onPress
}: IconButtonProps) => {
    const appColors = colors();

    return (
        <TouchableOpacity onPress={onPress} style={styles.container}>
            <FontAwesomeIcon
                icon={generalIcons.dumbbell}
                color={iconColor || appColors.icon}
                size={35}
            />
            <Text style={styles.text}>{label}</Text>
        </TouchableOpacity>
    )
}

const styles = StyleSheet.create({
    container: {
        justifyContent: 'center',
        alignItems: 'center',
        padding: 5,
        width: 120,
        height: 70,
        backgroundColor: '#F2F2F2',
        borderRadius: 20
    },
    text: {
        fontWeight: '600'
    }
})