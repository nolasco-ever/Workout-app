import { IconProp } from '@fortawesome/fontawesome-svg-core';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, useColorScheme } from 'react-native';
import { colors } from '../../colors';
import { generalIcons } from '../icons/icon-library';
import { useModalContext } from '../../packages/core-contexts/modal-context';
import { CustomText } from '../text/customText';

interface ListItemProps {
  icon?: string | IconProp;
  iconSize?: number;
  iconPosition?: 'top' | 'middle' | 'bottom';
  iconColor?: string;
  rightIcon?: string;
  rightIconSize?: number;
  rightIconColor?: string;
  title: string;
  description?: string;
  rightText?: string;
  topDivider?: boolean;
  onPress?: () => void;
  options?: ListItemProps[];
}

export const ListItem = ({
  icon,
  iconSize = 20,
  iconPosition = 'middle',
  iconColor,
  rightIcon,
  rightIconSize = 20,
  rightIconColor,
  title,
  description,
  rightText,
  topDivider = false,
  onPress,
  options,
}: ListItemProps) => {
  const appColors = colors();
  const colorScheme = useColorScheme();

  const { openModal, setModalVisible } = useModalContext();

  const ModalComponent = (options: ListItemProps[]) => {
    return (
      <View
        style={[
          styles.modalContentContainer,
          {
            backgroundColor: appColors.onBackground,
            shadowColor: '#000000',
            shadowOpacity: colorScheme === 'light' ? 0.1 : 0,
            shadowOffset: { width: 1, height: 1 },
          },
        ]}
      >
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', padding: 10 }}>
          <CustomText type="subheader">Options</CustomText>
          <TouchableOpacity onPress={() => setModalVisible(false)}>
            <FontAwesomeIcon icon={generalIcons.xMark} color={appColors.icon} size={20} />
          </TouchableOpacity>
        </View>
        {options.map((item, index) => (
          <ListItem
            key={index}
            title={item.title}
            icon={item.icon}
            description={item.description}
          />
        ))}
      </View>
    );
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        styles.container,
        {
          borderColor: appColors.inactive,
          borderTopWidth: topDivider ? 3 : 0,
          alignItems:
            iconPosition === 'middle'
              ? 'center'
              : iconPosition === 'top'
              ? 'flex-start'
              : 'flex-end',
        },
      ]}
    >
      {icon && (
        <View style={[styles.iconContainer, { backgroundColor: '#fff', borderRadius: 20 }]}>
          <FontAwesomeIcon
            icon={icon as IconProp}
            color={iconColor ? iconColor : appColors.icon}
            size={iconSize}
          />
        </View>
      )}
      <View style={styles.textContainer}>
        <Text style={[styles.title, { color: appColors.text }]}>{title}</Text>
        {description && (
          <Text style={[styles.description, { color: appColors.subtext }]}>{description}</Text>
        )}
      </View>
      {rightText && (
        <View style={styles.rightTextContainer}>
          <Text style={[styles.rightText, { color: appColors.subtext }]}>{rightText}</Text>
        </View>
      )}
      {rightIcon && (
        <FontAwesomeIcon
          icon={rightIcon as IconProp}
          color={rightIconColor ? rightIconColor : appColors.icon}
          size={rightIconSize}
          style={styles.iconContainer}
        />
      )}
      {options && (
        <TouchableOpacity
          onPress={() => openModal(ModalComponent(options))}
          style={styles.optionsButton}
        >
          <FontAwesomeIcon icon={generalIcons.ellipsisVertical} color={appColors.icon} size={20} />
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    flexDirection: 'row',
    padding: 10,
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
    marginLeft: 10,
  },
  rightText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  optionsButton: {
    marginLeft: 10,
  },
  modalContentContainer: {
    width: '100%',
    borderRadius: 10,
  },
});
