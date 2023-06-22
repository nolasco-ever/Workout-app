import React, { useState } from 'react';
import { View, TextInput, StyleSheet, TouchableOpacity, Dimensions, useColorScheme, Text } from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { IconProp } from '@fortawesome/fontawesome-svg-core';
import { generalIcons } from '../icons/icon-library';
import { colors } from '../../colors';

interface CustomTextInputProps {
  value?: string;
  onChangeText?: (text: string) => void;
  placeholder?: string;
  helperText?: string;
  leftIcon?: string;
  rightIcon?: string;
  isSecure?: boolean;
  keyboardType?: 'email-address' | 'number-pad' | 'numeric' | 'default';
  returnKeyType?: 'default' | 'done';
  error?: boolean;
  numberOfLines?: number;
  prefix?: string;
  suffix?: string;
}

export const CustomTextInput = ({ 
  value,
  onChangeText,
  placeholder,
  helperText,
  leftIcon,
  rightIcon, 
  isSecure=false, 
  keyboardType="default", 
  returnKeyType='default',
  error=false,
  numberOfLines,
  prefix,
  suffix
}: CustomTextInputProps) => {
  
  const appColors = colors();
  const screenWidth = Dimensions.get('window').width;
  const systemTheme = useColorScheme();
  const [showText, setShowText] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const toggleShowText = () => {
    setShowText(!showText);
  }

  const getBorderColor = () => {
    if (isFocused) {
      if (error) {
        return appColors.onError
      } else {
        return appColors.primary
      }
    } else {
      if (error) {
        return appColors.onError
      } else {
        return appColors.inactive
      }
    }
  }

  return (
    <View style={{flex: 1}}>
      <View 
        style={[
          styles.container, 
          {
            borderColor: getBorderColor(),
            borderWidth: isFocused ? 2 : 1,
            height: screenWidth/9
          }
        ]}
      >
        {leftIcon && (
          <FontAwesomeIcon
              icon={leftIcon as IconProp}
              color={error ? appColors.onError : isFocused ? appColors.primary : appColors.icon}
          />
        )}
        {prefix && (
          <Text style={[styles.helperText, {color: getBorderColor()}]}>{prefix}</Text>
        )}
        <TextInput
          style={[styles.input, {color: appColors.text}]}
          placeholder={placeholder}
          secureTextEntry={isSecure && !showText}
          value={value}
          onChangeText={onChangeText}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          keyboardType={keyboardType}
          returnKeyType={returnKeyType}
          numberOfLines={numberOfLines}
          placeholderTextColor={appColors.inactive}
        />
        {suffix && (
          <Text style={[styles.helperText, {color: getBorderColor()}]}>{suffix}</Text>
        )}
        {rightIcon && (
          <FontAwesomeIcon
              icon={rightIcon as IconProp}
              color={error ? appColors.onError : isFocused ? appColors.primary : appColors.icon}
          />
        )}
      </View>
      {helperText && (
        <Text style={[styles.helperText, {color: getBorderColor()}]}>{helperText}</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      borderRadius: 5,
      padding: 10,
      borderWidth: 1,
      margin: 5
    },
    input: {
      flex: 1,
      fontSize: 16,
      marginLeft: 10,
    },
    icon: {
      marginRight: 10,
    },
    eyeIcon: {
      marginLeft: 10,
    },
    helperText: {
      paddingLeft: 10
    }
});

