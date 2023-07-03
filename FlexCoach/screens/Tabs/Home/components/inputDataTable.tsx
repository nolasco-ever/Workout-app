import { Dimensions, Keyboard, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, useColorScheme } from 'react-native'
import React, { useState } from 'react'
import { InputDataListItem } from './inputDataListItem'
import { colors } from '../../../../colors';
import { CustomText } from '../../../../components/text/customText';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { generalIcons } from '../../../../components/icons/icon-library';
import { IconProp } from '@fortawesome/fontawesome-svg-core';

type Exercise = {
    set: number;
    weight: number | null;
    reps: number | null;
};

interface InputTableProps {
    data: Exercise[];
    navigation: any;
}

export const InputDataTable = ({data, navigation}: InputTableProps) => {
    const appColors = colors();
    const systemMode = useColorScheme();
    const screenWidth = Dimensions.get('window').width;

    const [tableData, setTableData] = useState(data);

    const handleAddRow = () => {
        const lastExercise = tableData[tableData.length - 1];
        const newExercise: Exercise = {
        set: lastExercise.set + 1,
        weight: lastExercise.weight,
        reps: lastExercise.reps,
        };
        setTableData([...tableData, newExercise]);
    };

    const handleDeleteRow = (index: number) => {
        if (tableData.length > 1) {
          const newTableData = [...tableData];
          newTableData.splice(index, 1);
          setTableData(newTableData);
        }
      };

    const handleInputChange = (text: string, index: number, field: keyof Exercise) => {
        const newTableData = [...tableData];
        newTableData[index][field] = Number(text);
        setTableData(newTableData);
    };

    const isLastRowEmpty = () => {
        return (tableData[tableData.length - 1].weight === null || tableData[tableData.length - 1].reps === null)
                ? true : false
    }

    return (
        <View style={styles.container}>
          <View style={styles.headerRow}>
            <Text style={[styles.headerCell, {width: screenWidth/3, color: appColors.text}]}>Set</Text>
            <Text style={[styles.headerCell, {width: screenWidth/3, color: appColors.text}]}>Weight</Text>
            <Text style={[styles.headerCell, {width: screenWidth/3, color: appColors.text}]}>Reps</Text>
          </View>
          <ScrollView onScrollBeginDrag={Keyboard.dismiss}>
            {tableData.map((exercise, index) => (
                <View key={index} style={styles.row}>
                    <Text style={[styles.cell,{color: appColors.text, fontWeight: 'bold'}]}>{exercise.set}</Text>
                    <TextInput
                        style={[styles.cell, {color: appColors.text, backgroundColor: systemMode === 'dark' ? appColors.onBackground : appColors.lightGrey}]}
                        value={String(exercise.weight) === 'null' ? '' : String(exercise.weight)}
                        onChangeText={(text) => handleInputChange(text, index, 'weight')}
                        keyboardType='number-pad'
                    />
                    <TextInput
                        style={[styles.cell, {color: appColors.text, backgroundColor: systemMode === 'dark' ? appColors.onBackground : appColors.lightGrey}]}
                        value={String(exercise.reps) === 'null' ? '' : String(exercise.reps)}
                        onChangeText={(text) => handleInputChange(text, index, 'reps')}
                        keyboardType='number-pad'
                    />
                </View>
            ))}
            <View style={{flexDirection: 'row', justifyContent: 'flex-end', marginRight: 5}}>
                <TouchableOpacity style={[styles.plusMinusContainer, {marginRight: 10, backgroundColor: isLastRowEmpty() ? appColors.inactive : appColors.onSuccess}]} onPress={handleAddRow} disabled={isLastRowEmpty()}>
                    <FontAwesomeIcon
                        icon={generalIcons.plus as IconProp}
                        color={appColors.background}
                        size={20}
                    />
                </TouchableOpacity>
                <TouchableOpacity style={[styles.plusMinusContainer, {backgroundColor: tableData.length === 1 ? appColors.inactive : appColors.onError}]} onPress={() => handleDeleteRow(tableData.length - 1)} disabled={tableData.length === 1}>
                    <FontAwesomeIcon
                        icon={generalIcons.minus as IconProp}
                        color={appColors.background}
                        size={20}
                    />
                </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 10
    },
    headerRow: {
        flexDirection: 'row',
        marginBottom: 5
    },
    headerCell: {
        fontWeight: 'bold',
        fontSize: 16
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10
    },
    cell: {
        flex: 1,
        borderRadius: 10,
        padding: 12,
        margin: 5,
    },
    deleteButton: {
        color: 'red',
        fontWeight: 'bold',
        marginLeft: 5,
    },
    addRowButton: {
        alignSelf: 'center',
        marginVertical: 10,
        padding: 5,
        backgroundColor: '#007aff',
        color: '#fff',
        borderRadius: 5,
    },
    plusMinusContainer: {
        borderRadius: 50,
        padding: 5
    }
});