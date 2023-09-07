import { SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import React, { ReactNode } from 'react'
import { colors } from '../../colors'
import { IconProp } from '@fortawesome/fontawesome-svg-core';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';

interface NavigationHeaderProps {
    title: string;
    subtitle?: string;
    navigationButtons?: ReactNode[];
}

export const NavigationHeader = ({
    title,
    subtitle,
    navigationButtons
}: NavigationHeaderProps) => {
    const appColors = colors();

    return (
        <SafeAreaView style={{backgroundColor: appColors.background}}>
            <View style={styles.container}>
                <View>
                    <Text style={[styles.titleText, {color: appColors.text}]}>{title}</Text>
                    {subtitle && (
                        <Text style={[styles.subtext, {color: appColors.subtext}]}>{subtitle}</Text>
                    )}
                </View>
                {navigationButtons ? (
                    <View style={styles.buttonsContainer}>
                        {navigationButtons}
                    </View>
                ) : null}
            </View>
        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 10
    },
    titleText: {
        fontSize: 32,
        fontWeight: 'bold'
    },
    subtext: {
        fontSize: 14
    },
    buttonsContainer: {
        flexDirection: 'row'
    }
})