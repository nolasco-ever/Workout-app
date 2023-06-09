import { StyleSheet, Text, TouchableOpacity, View, useColorScheme } from 'react-native'
import React from 'react'
import { IconProp } from '@fortawesome/fontawesome-svg-core';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { colors } from '../../colors';
import { generalIcons } from '../icons/icon-library';

interface SelectionItemProps {
    selectedItems: string[];
    title: string;
    onPressItem: () => void;
    onPressInfo?: () => void;
}

export const SelectionItem = ({selectedItems, title, onPressItem, onPressInfo}: SelectionItemProps) => {
    const appColors = colors();

    return (
        <TouchableOpacity
            style={[
                styles.workoutItem,
                {
                backgroundColor: selectedItems.includes(title) ? appColors.secondary : appColors.onBackground,
                shadowColor: '#000000',
                shadowOpacity: useColorScheme() === 'light' ? 0.1 : 0,
                shadowOffset: {width: 1, height: 1}
                }
            ]}
            onPress={onPressItem}>
            <Text style={[styles.workoutTitle, {color: appColors.text}]}>{title}</Text>
            {onPressInfo && <TouchableOpacity onPress={onPressInfo}>
                <FontAwesomeIcon
                icon={generalIcons.info as IconProp}
                color={appColors.text}
                size={15}
                />
            </TouchableOpacity>}
        </TouchableOpacity>
    )
}

const styles = StyleSheet.create({
    workoutItem: {
        padding: 10,
        borderRadius: 5,
        margin: 5,
        flexDirection: 'row',
        alignItems: 'center'
      },
      workoutTitle: {
        fontSize: 16,
        marginRight:  5
      },
})