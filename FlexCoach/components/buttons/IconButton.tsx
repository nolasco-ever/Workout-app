import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import React from 'react';
import { colors } from '../../colors';
import { Icon, IconSource } from '../icons/Icon';
import { generalIcons } from '../icons/icon-library';

interface IconButtonProps {
    icon: IconSource;
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
        <TouchableOpacity onPress={onPress} style={[styles.container, {backgroundColor: appColors.iconButton}]}>
            <Icon
                icon={icon}
                color={iconColor || appColors.icon}
                size={35}
            />
            <Text style={[styles.text, {color: appColors.text}]}>{label}</Text>
        </TouchableOpacity>
    )
}

const styles = StyleSheet.create({
    container: {
        justifyContent: 'center',
        alignItems: 'center',
        padding: 5,
        width: 110,
        height: 70,
        borderRadius: 20
    },
    text: {
        fontWeight: '600',
        marginTop: 5
    }
})