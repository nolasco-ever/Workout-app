import { ScrollView, StyleSheet, Text, View } from 'react-native'
import React from 'react'
import { colors } from '../../colors'
import { CustomText } from '../text/customText';

export const ResultsList = () => {
    const appColors = colors();

    return (
        <ScrollView style={[styles.container, {backgroundColor: appColors.background}]}>
            <CustomText>ResultsList</CustomText>
        </ScrollView>
    )
}

const styles = StyleSheet.create({
    container: {
        height: '100%',
        width: '100%'
    }
})