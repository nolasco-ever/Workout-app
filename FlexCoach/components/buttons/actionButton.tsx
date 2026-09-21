import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import React from 'react'
import { colors } from '../../colors'
import { Icon, IconSource } from '../icons/Icon';
import { directionIcons } from '../icons/icon-library';
import { ParamListBase } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

interface ActionButtonProps {
    navigation: NativeStackNavigationProp<ParamListBase>;
    icon: IconSource;
    message: string;
}

export const ActionButton = ({navigation, icon, message}: ActionButtonProps) => {
    const appColors = colors();

    return (
        <TouchableOpacity onPress={() => navigation.navigate('workoutHub')} style={[styles.container, {backgroundColor: appColors.primary}]}>
            <View style={styles.iconContainer}>
                <Icon
                    icon={icon}
                    color={appColors.icon}
                    size={30}
                />
            </View>
            
            <View style={styles.textContainer}>
                <Text numberOfLines={3} style={[styles.text, {color: appColors.onPrimaryText}]}>{message}</Text>
            </View>

            <View>
                <Icon
                    icon={directionIcons.rightArrow}
                    color={appColors.icon}
                    size={30}
                />
            </View>
        </TouchableOpacity>
    )
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 10,
        padding: 10,
        margin: 10,
    },
    iconContainer: {
        marginRight: 10
    },
    textContainer: {
        flex: 1,
        height: '100%'
    },
    text: {
        fontWeight: 'bold',
        fontSize: 18
    }
})