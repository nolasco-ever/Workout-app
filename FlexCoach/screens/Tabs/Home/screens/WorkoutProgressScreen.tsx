import { StyleSheet, Text, View } from 'react-native'
import React from 'react'
import { colors } from '../../../../colors'

export const WorkoutProgressScreen = () => {
    const appColors = colors();

    return (
        <View style={[styles.container, {backgroundColor: appColors.background}]}>
            <Text>WorkoutProgressScreen</Text>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 10,
    },
})