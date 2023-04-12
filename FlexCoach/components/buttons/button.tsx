import React from 'react';
import { StyleSheet, TouchableOpacity, Text, Dimensions } from 'react-native';
import { colors } from '../../colors';

interface ButtonProps {
  onPress: () => void;
  title: string;
  isPrimary: boolean;
  disabled?: boolean;
}

export const Button = ({ onPress, title, isPrimary, disabled }: ButtonProps) => {
  const screenWidth = Dimensions.get('window').width;
  const appColors = colors();

  const buttonStyle = isPrimary ? 
    {
      width: screenWidth - 40,
      backgroundColor: disabled ? appColors.inactive : appColors.primary,
    } : 
      {
        width: screenWidth - 40,
        backgroundColor: 'transparent',
        borderWidth: 2,
        borderColor: appColors.accent,
      };

  const buttonTextStyle = isPrimary ? 
    {
      color: appColors.onPrimaryText,
    } : 
      {
        color: appColors.accent,
      };
      
  return (
    <TouchableOpacity disabled={disabled} onPress={onPress} style={[styles.button, buttonStyle]}>
      <Text style={[styles.buttonText, buttonTextStyle]}>{title}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    height: 50,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    margin: 10,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
});