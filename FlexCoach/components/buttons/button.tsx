import React from 'react';
import { StyleSheet, TouchableOpacity, Text, Dimensions } from 'react-native';
import { colors } from '../../colors';

interface ButtonProps {
  onPress: () => void;
  title: string;
  isPrimary: boolean;
  disabled?: boolean;
  color?: string;
  textColor?: string;
}

export const Button = ({ onPress, title, isPrimary, disabled, color, textColor }: ButtonProps) => {
  const screenWidth = Dimensions.get('window').width;
  const appColors = colors();

  const primaryColor = color ? color : appColors.primary;
  const buttonTextColor = textColor ? textColor : appColors.onPrimaryText;
  const secondaryColor = color ? color : appColors.accent;

  const buttonStyle = isPrimary ? 
    {
      backgroundColor: disabled ? appColors.inactive : primaryColor,
    } : 
      {
        backgroundColor: 'transparent'
      };

  const buttonTextStyle = isPrimary ? 
    {
      color: buttonTextColor,
      fontSize: 18,
    } : 
      {
        color: secondaryColor,
        fontSize: 16,
      };
      
  return (
    <TouchableOpacity disabled={disabled} onPress={onPress} style={[styles.button, buttonStyle]}>
      <Text style={[styles.buttonText, buttonTextStyle]}>{title}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    width: '90%',
    height: 50,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    margin: 10,
  },
  buttonText: {
    fontWeight: 'bold',
  },
});