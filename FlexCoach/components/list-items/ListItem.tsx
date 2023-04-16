import { IconProp } from '@fortawesome/fontawesome-svg-core';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { colors } from '../../colors';

interface Props {
  icon?: string;
  iconPosition?: 'top' | 'middle' | 'bottom';
  iconColor?: string;
  title: string;
  description?: string;
  rightText?: string;
  topDivider?: boolean;
  onPress?: () => void;
}

export const ListItem = ({
  icon, 
  iconPosition='middle', 
  iconColor, 
  title, 
  description,
  rightText,
  topDivider=false, 
  onPress 
}: Props) => {
    const appColors = colors();

    return (
      <TouchableOpacity
        onPress={onPress} 
        style={[
          styles.container, 
          {
            borderColor: appColors.inactive, 
            borderTopWidth: topDivider ? 3 : 0,
            alignItems: iconPosition === 'middle' ? 'center' : iconPosition === 'top' ? 'flex-start' : 'flex-end',
          }
        ]}
      >
        {icon && 
          <FontAwesomeIcon
              icon={icon as IconProp}
              color={iconColor ? iconColor : appColors.icon}
              size={20}
              style={styles.iconContainer}
          />
      }
        <View style={styles.textContainer}>
          <Text style={[styles.title, {color: appColors.text}]}>{title}</Text>
          {description && <Text style={[styles.description, {color: appColors.subtext}]}>{description}</Text>}
        </View>
        {rightText && (
          <View style={styles.rightTextContainer}>
            <Text style={[styles.rightText, {color: appColors.subtext}]}>{rightText}</Text>
          </View>
        )}
      </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    flexDirection: 'row',
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
  rightTextContainer: {
    marginLeft: 10
  },
  rightText: {
    fontSize: 12,
    fontWeight: 'bold'
  }
});