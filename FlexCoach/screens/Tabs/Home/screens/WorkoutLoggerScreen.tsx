import { StyleSheet, Text, View } from 'react-native'
import React, { useState } from 'react'
import { colors } from '../../../../colors';
import { CustomText } from '../../../../components/text/customText';
import { InputDataListItem } from '../components/inputDataListItem';
import { InputDataTable } from '../components/inputDataTable';
import { PreviousWorkoutCard } from '../components/previousWorkoutCard';
import { Button } from '../../../../components/buttons/button';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { HomeStackParams } from '../HomeStack';

const WorkoutLoggerScreen = ({ route}: { route: any }) => {
    const navigation = useNavigation<NavigationProp<HomeStackParams>>();
    
    const { exercise, completed } = route.params;
    const appColors = colors();

    return (
        <View style={[styles.container, {backgroundColor: appColors.background}]}>
            <CustomText centered>{exercise.name}</CustomText>
            <PreviousWorkoutCard

            />
            <InputDataTable
                data={exercise.data}
                navigation={navigation}
            />
            <Button
                label='Done'
                onPress={(() => {
                    // data = tableData;
                    navigation.goBack();
                })}
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