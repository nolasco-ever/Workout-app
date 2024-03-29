import { Keyboard, ScrollView, StyleSheet, Text, View } from 'react-native'
import React, { useState } from 'react'
import { colors } from '../../../../colors'
import { CustomText } from '../../../../components/text/customText';
import { Button } from '../../../../components/buttons/button';
import { CustomTextInput } from '../../../../components/text-input/CustomTextInput';
import { NumberPicker } from '../../../../components/Pickers/numberPicker';
import { SearchBar } from '../../../../components/search-bar/searchBar';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import { HomeStackParams } from '../HomeStack';

export const AddDietEntryScreen = () => {
    const navigation = useNavigation<NavigationProp<HomeStackParams>>();
    const appColors = colors();

    const [numOfServings, setNumOfServings] = useState<number>(0);

    const handleValueChange = (newValue: number) => {
        setNumOfServings(newValue);
    }
    const [value, setValue] = useState<string>('');
    return (
        <View style={[styles.container, {backgroundColor: appColors.background}]}>
            <SearchBar
                value={value}
                onClear={() => console.log('clear')}
                navigation={navigation}
            />
            <ScrollView onTouchStart={() => Keyboard.dismiss} style={{flex: 1, flexDirection: 'column'}}>
                <View style={styles.headerContainer}>
                    <CustomText type="subheader">Enter the amount for 1 serving. You can record the amount of servings at the bottom.</CustomText>
                </View>
                <View style={styles.textInputContainer}>
                    <CustomTextInput
                        placeholder='Name'
                    />
                </View>

                <View style={styles.textInputContainer}>
                    <CustomTextInput
                        placeholder='Calories'
                        keyboardType='number-pad'
                    />
                    <CustomTextInput
                        placeholder='Protein'
                        keyboardType='number-pad'
                        suffix='g'
                    />
                </View>

                <NumberPicker
                    label='Number of servings'
                    min={1}
                    max={10}
                    onValueChange={handleValueChange}
                />
            </ScrollView>
            <Button
                label='Done'
                onPress={() => navigation.goBack()}
            />
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    headerContainer: {
        margin: 10
    },
    textInputContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 10
    }
})