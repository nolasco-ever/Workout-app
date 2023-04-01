import React, { useState } from 'react';
import { TouchableOpacity, View, Text, StyleSheet, Dimensions } from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { generalIcons } from '../icons/icon-library';
import { IconProp } from '@fortawesome/fontawesome-svg-core';
import { colors } from '../../colors';

interface NotificationButtonProps {
  unseenNotifications: boolean;
  onPress: () => void;
}

export const NotificationButton = ({ unseenNotifications, onPress }: NotificationButtonProps) => {
  const screenWidth = Dimensions.get('window').width;
  const appColors = colors();
  const [showIndicator, setShowIndicator] = useState(unseenNotifications);

  const toggleIndicator = () => {
    setShowIndicator(!showIndicator);
    onPress();
  };

  return (
    <TouchableOpacity 
      style={{
        width: screenWidth / 10,
        height: screenWidth / 10,
        margin: 10
      }} 
      onPress={toggleIndicator}
    >
      <View 
        style={[
          styles.iconContainer, 
          {
            borderColor: appColors.subtext, 
            width: screenWidth / 10,
            height: screenWidth / 10
          }
        ]}
      >
        <View>
          <FontAwesomeIcon icon={generalIcons.bell as IconProp} size={20} color={appColors.text} />
        </View>
        {showIndicator && <View style={[styles.notificationIndicator, {backgroundColor: appColors.accent}]} />}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  iconContainer: {
    borderWidth: 0.5,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  notificationIndicator: {
    position: 'absolute',
    top: '20%',
    right: '20%',
    borderRadius: 50,
    width: 10,
    height: 10,
  },
  icon: {
    color: '#444',
    fontSize: 20,
  },
  unseenNotifications: {
    color: '#f00',
  },
});

