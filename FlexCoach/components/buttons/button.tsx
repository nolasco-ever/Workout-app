import React from 'react';
import { StyleSheet, TouchableOpacity, Text, Dimensions } from 'react-native';
import { colors } from '../../colors';

interface ButtonProps {
  onPress: () => void;
  title: string;
  isPrimary: boolean;
}

const screenWidth = Dimensions.get('window').width;
const appColors = colors();

export const Button = ({ onPress, title, isPrimary }: ButtonProps) => {
  const buttonStyle = isPrimary ? styles.primaryButton : styles.secondaryButton;
  const buttonTextStyle = isPrimary ? styles.primaryButtonText : styles.secondaryButtonText;
  return (
    <TouchableOpacity onPress={onPress} style={[styles.button, buttonStyle]}>
      <Text style={[styles.buttonText, buttonTextStyle]}>{title}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    height: 50,
    width: screenWidth - 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    margin: 10,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  primaryButton: {
    backgroundColor: appColors.primary,
  },
  primaryButtonText: {
    color: appColors.onPrimaryText,
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: appColors.accent,
  },
  secondaryButtonText: {
    color: appColors.accent,
  },
});