import React, { useState } from 'react';
import { View, TextInput, StyleSheet, TouchableOpacity, Dimensions, useColorScheme } from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { IconProp } from '@fortawesome/fontawesome-svg-core';
import { generalIcons } from '../icons/icon-library';
import { colors } from '../../colors';

interface CustomTextInputProps {
  icon?: string;
  placeholder?: string;
  isPassword?: boolean;
  value?: string;
  onChangeText?: (text: string) => void;
}

export const CustomTextInput = ({ icon, placeholder, isPassword, value, onChangeText }: CustomTextInputProps) => {
  const appColors = colors();
  const screenWidth = Dimensions.get('window').width;
  const systemTheme = useColorScheme();
  const [showPassword, setShowPassword] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const toggleShowPassword = () => {
    setShowPassword(!showPassword);
  }

  return (
    <View style={{flex: 1}}>
      <View 
        style={[
          styles.container, 
          {
            borderColor: isFocused ? appColors.accent : appColors.subtext,
            height: screenWidth/10,
            backgroundColor: systemTheme === 'dark' ? appColors.onBackground : appColors.lightGrey
          }
        ]}
      >
        {icon && (
          <FontAwesomeIcon
              icon={icon as IconProp}
              color={isFocused ? appColors.accent : appColors.text}
          />
        )}
        <TextInput
          style={[styles.input, {color: appColors.text}]}
          placeholder={placeholder}
          secureTextEntry={isPassword && !showPassword}
          value={value}
          onChangeText={onChangeText}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
        />
        {isPassword && (
          <TouchableOpacity onPress={toggleShowPassword}>
              <FontAwesomeIcon
                icon={showPassword ? generalIcons.eye as IconProp : generalIcons.eyeSlash as IconProp}
                style={styles.eyeIcon}
              />
          </TouchableOpacity>
        )}
      </View>
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
});

