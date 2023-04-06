import { IconProp } from '@fortawesome/fontawesome-svg-core';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { colors } from '../../colors';

interface Props {
  icon?: string;
  title: string;
  description?: string;
  topDivider?: boolean;
  onPress?: () => void;
}

export const ListItem: React.FC<Props> = ({ icon, title, description, topDivider=false, onPress }) => {
    const appColors = colors();

  return (
    <TouchableOpacity onPress={onPress} style={[styles.container, {borderColor: appColors.inactive, borderTopWidth: topDivider ? 3 : 0}]}>
      {icon && 
        <FontAwesomeIcon
            icon={icon as IconProp}
            color={appColors.icon}
            size={20}
            style={styles.iconContainer}
        />
    }
      <View style={styles.textContainer}>
        <Text style={[styles.title, {color: appColors.text}]}>{title}</Text>
        {description && <Text style={[styles.description, {color: appColors.subtext}]}>{description}</Text>}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
  },
  iconContainer: {
    marginRight: 15,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
  },
});