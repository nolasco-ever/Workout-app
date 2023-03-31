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

const screenWidth = Dimensions.get('window').width;
const appColors = colors();

export const NotificationButton = ({ unseenNotifications, onPress }: NotificationButtonProps) => {
  const [showIndicator, setShowIndicator] = useState(unseenNotifications);

  const toggleIndicator = () => {
    setShowIndicator(!showIndicator);
    onPress();
  };

  return (
    <TouchableOpacity style={styles.container} onPress={toggleIndicator}>
      <View style={styles.iconContainer}>
        <View>
          <FontAwesomeIcon icon={generalIcons.bell as IconProp} size={20} color={appColors.text} />
        </View>
        {showIndicator && <View style={styles.notificationIndicator} />}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 50,
    height: 50,
    margin: 10
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderWidth: 0.5,
    borderColor: appColors.subtext,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  notificationIndicator: {
    position: 'absolute',
    top: '20%',
    right: '20%',
    backgroundColor: appColors.accent,
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

