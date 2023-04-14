import { StyleSheet, Text, View } from 'react-native'
import React from 'react'
import { colors } from '../../../../colors';
import { CustomText } from '../../../../components/text/customText';
import { InputDataListItem } from '../components/inputDataListItem';
import { InputDataTable } from '../components/inputDataTable';

const WorkoutLoggerScreen = ({ navigation, route}: {navigation: any, route: any}) => {
    const { exercise } = route.params;
    const appColors = colors();

    const columnHeaders = Object.keys(exercise.data[0])
    return (
        <View style={[styles.container, {backgroundColor: appColors.background}]}>
            <CustomText centered>{exercise.name}</CustomText>
            <InputDataTable
                data={exercise.data}
                navigation={navigation}
            />
        </View>
    )
}

export default WorkoutLoggerScreen

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingTop: 10
    }
})