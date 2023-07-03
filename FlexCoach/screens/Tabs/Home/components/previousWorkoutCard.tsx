import { Dimensions, StyleSheet, Text, View, useColorScheme } from 'react-native'
import React from 'react'
import { CustomText } from '../../../../components/text/customText'
import { colors } from '../../../../colors'

export const PreviousWorkoutCard = () => {
    const appColors = colors();
    const screenHeight = Dimensions.get('window').height;
    const systemTheme = useColorScheme();

    return (
        <View
            style={[
                styles.container,
                {
                    backgroundColor: appColors.onBackground,
                    shadowColor: '#000000',
                    shadowOpacity: systemTheme === 'light' ? 0.1 : 0,
                    shadowOffset: {width: 1, height: 1}
                }
            ]}
        >
        <CustomText type='subheader' centered>Last Session</CustomText>
        <View style={[styles.statsContainer]}>
            <View style={[styles.statsCell]}>
                <CustomText centered>Max weight</CustomText>
                <CustomText centered>50</CustomText>
            </View>
            <View style={[styles.statsCell]}>
                <CustomText centered>Min weight</CustomText>
                <CustomText centered>40</CustomText>
            </View>
            <View style={[styles.statsCell]}>
                <CustomText centered>Max reps</CustomText>
                <CustomText centered>10</CustomText>
            </View>
            <View style={[styles.statsCell]}>
                <CustomText centered>Min reps</CustomText>
                <CustomText centered>7</CustomText>
            </View>
            <View style={[styles.statsCell]}>
                <CustomText centered>Total sets</CustomText>
                <CustomText centered>4</CustomText>
            </View>
        </View>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        padding: 10,
        flexDirection: 'column',
        borderRadius: 10,
        margin: 10
    },
    statsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center'
    },
    statsCell: {
        width: '50%',
        marginTop: 10,
        marginBottom: 5
    }
})