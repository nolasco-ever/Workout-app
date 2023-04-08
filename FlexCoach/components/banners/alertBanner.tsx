import { StyleSheet, Text, View, useColorScheme } from 'react-native'
import React, { useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome'
import { generalIcons } from '../icons/icon-library'
import { IconProp } from '@fortawesome/fontawesome-svg-core'
import { colors } from '../../colors'
import { TouchableOpacity, TouchableWithoutFeedback } from 'react-native-gesture-handler'
import { CustomText } from '../text/customText'

interface AlertBannerProps {
  message: string;
  type?: 'success' | 'warning' | 'error';
  isClosable?: boolean;
}

export const AlertBanner = ({message, type, isClosable=false}: AlertBannerProps) => {
  const appColors = colors();
  const colorScheme = useColorScheme();

  const [visible, setVisible] = useState(true);
  let icon: string;

  switch (type) {
    case 'success':
      icon = generalIcons.success;
      break;
    case 'warning':
      icon = generalIcons.warning;
      break;
    case 'error':
      icon = generalIcons.error;
      break;
    default:
      icon = generalIcons.info;
  }

  const getBackgroundColor = (type: AlertBannerProps['type']): string => {
    switch (type) {
      case 'success':
        return appColors.success;
      case 'warning':
        return appColors.warning;
      case 'error':
        return appColors.error;
      default:
        return appColors.info;
    }
  };

  const getIconColor = (type: AlertBannerProps['type']): string => {
    switch (type) {
      case 'success':
        return appColors.onSuccess;
      case 'warning':
        return appColors.onWarning;
      case 'error':
        return appColors.onError;
      default:
        return appColors.onInfo;
    }
  };
  
  const handlePress = () => {
    if (isClosable) {
      setVisible(false);
    }
  };

  return visible ? (
    <TouchableOpacity onPress={handlePress}>
        <View
          style={[
            styles.container,
            {
              borderRadius: 10,
              margin: 10,
              backgroundColor: getBackgroundColor(type),
              shadowColor: '#000000',
              shadowOpacity: colorScheme === 'light' ? 0.1 : 0,
              shadowOffset: {width: 1, height: 1}
            }
          ]}
        >
          <FontAwesomeIcon
            icon={icon as IconProp}
            color={getIconColor(type)}
            style={{marginRight: 10}}
          />
          <Text style={[styles.text, {color: appColors.onBanner}]}>{message}</Text>
          
          {isClosable && <FontAwesomeIcon
            icon={generalIcons.xMark as IconProp}
            color={getIconColor(type)}
            style={{marginRight: 10}}
          />}
        </View>
    </TouchableOpacity>
  ) : null
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
  },
  text: {
    flex: 1,
    fontWeight: 'bold',
    fontSize: 14
  }
})