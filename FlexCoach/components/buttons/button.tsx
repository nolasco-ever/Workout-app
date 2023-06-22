import React from 'react';
import { StyleSheet, TouchableOpacity, Text, Dimensions } from 'react-native';
import { colors } from '../../colors';

interface ButtonProps {
  type?: 'filled' | 'outline' | 'text';
  isActive?: boolean;
  label: string;
  leftIcon?: string;
  rightIcon?: string;
  onPress: () => void;
}

export const Button = ({ 
  type='filled',
  isActive=true,
  label,
  leftIcon,
  rightIcon,
  onPress
}: ButtonProps) => {
  const screenWidth = Dimensions.get('window').width;
  const appColors = colors();

  const getButtonColor = () => {
    if (type === 'filled') {
      if (isActive) {
        return appColors.primary
      } else {
        return appColors.inactive
      }
    } else {
      return appColors.transparent
    }
  }

  const getTextColor = () => {
    if (type === 'filled') {
      if (isActive) {
        return appColors.onPrimaryText
      } else {
        return appColors.lightGrey
      }
    } else {
      if (isActive) {
        return appColors.primary
      } else {
        return appColors.inactive
      }
    }
  }

  const buttonContainerStyle = {
    backgroundColor: getButtonColor(),
    borderWidth: type === 'outline' ? 2 : 0,
    borderColor: isActive ? appColors.primary : appColors.inactive
  }

  const buttonTextStyle = {
    color: getTextColor()
  }
      
  return (
    <TouchableOpacity disabled={!isActive} onPress={onPress} style={[styles.button, buttonContainerStyle]}>
      <Text style={[styles.buttonText, buttonTextStyle]}>{label}</Text>
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
    fontSize: 16
  },
});