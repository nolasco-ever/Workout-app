import { StyleSheet, Text, View } from 'react-native'
import React from 'react'
import { colors } from '../../colors'
import { CustomText } from '../text/customText';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { generalIcons } from '../icons/icon-library';
import { IconProp } from '@fortawesome/fontawesome-svg-core';
import { TouchableOpacity } from 'react-native-gesture-handler';

interface CheckBoxProps {
    label: string;
    checked: boolean;
    onPress: () => void;
}

export const CheckBox = ({label, checked, onPress}: CheckBoxProps) => {
    const appColors = colors();
  return (
    <TouchableOpacity onPress={onPress} style={styles.container}>
        <View style={[styles.checkBox, {borderColor: appColors.inactive}]}>
            {checked && (
                <FontAwesomeIcon
                    icon={generalIcons.check as IconProp}
                    color='green'
                />
            )}
        </View>
        <Text style={{color: appColors.text, fontWeight: 'bold', fontSize: 16}}>{label}</Text>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        margin: 10
    },
    checkBox: {
        height: 20,
        width: 20,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderRadius: 5,
        padding: 5,
        marginRight: 10
    }
})