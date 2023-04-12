import { StyleSheet, Text, TouchableOpacity, View, useColorScheme } from 'react-native'
import React, { useState } from 'react'
import { colors } from '../../colors';
import { CustomText } from '../text/customText';

interface NumberPickerProps {
    label?: string;
    min: number;
    max: number;
    onValueChange: (value: number) => void;
  };

export const NumberPicker = ({ label, min, max, onValueChange }: NumberPickerProps) => {
    const appColors = colors();
    const [value, setValue] = useState(min);

    const increment = () => {
      const newValue = value + 1;
      if (newValue <= max) {
        setValue(newValue);
        onValueChange(newValue);
      }
    };
  
    const decrement = () => {
      const newValue = value - 1;
      if (newValue >= min) {
        setValue(newValue);
        onValueChange(newValue);
      }
    };
  
    return (
      <View style={styles.container}>
        <CustomText>{label}</CustomText>
        <View style={styles.buttonsContainer}>
            <TouchableOpacity style={[styles.button, {backgroundColor: value === min ? appColors.inactive : appColors.onBackground, shadowOpacity: useColorScheme() === 'light' ? 0.1 : 0,}]} onPress={decrement}>
                <Text style={[styles.buttonText, {color: value === min ? appColors.onPrimaryText : appColors.text}]}>-</Text>
            </TouchableOpacity>
            <Text style={[styles.valueText, {color: appColors.text}]}>{value}</Text>
            <TouchableOpacity style={[styles.button, {backgroundColor: value === max ? appColors.inactive : appColors.onBackground, shadowOpacity: useColorScheme() === 'light' ? 0.1 : 0,}]} onPress={increment}>
                <Text style={[styles.buttonText, {color: value === max ? appColors.onPrimaryText : appColors.text}]}>+</Text>
            </TouchableOpacity>
        </View>
      </View>
    );
}

const styles = StyleSheet.create({
    container: {
        margin: 10,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between'
    },
    buttonsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    button: {
      padding: 10,
      borderRadius: 5,
      marginHorizontal: 5,
      width: 35,
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: '#000000',
      shadowOffset: {width: 1, height: 1}
    },
    buttonText: {
      fontSize: 20,
      fontWeight: 'bold',
    },
    valueText: {
      fontSize: 20,
      fontWeight: 'bold',
      marginHorizontal: 10,
    },
  });