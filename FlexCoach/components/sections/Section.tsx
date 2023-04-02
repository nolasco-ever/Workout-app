import { IconProp } from '@fortawesome/fontawesome-svg-core';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import React, { FC } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../../colors';
import { CustomText } from '../text/customText';

interface SectionProps {
  title: string;
  icon?: string;
  iconColor?: string;
  children: React.ReactNode
}

export const Section: FC<SectionProps> = ({ title, icon, iconColor, children }) => {
    const appColors = colors();
    return (
        <View style={styles.container}>
            <View style={styles.titleContainer}>
                {icon && (
                    <View style={styles.iconContainer}>
                        <FontAwesomeIcon 
                            icon={icon as IconProp}
                            color={iconColor ? iconColor : appColors.icon}
                            size={25}
                        />
                    </View>
                )}
                <CustomText type='header'>{title}</CustomText>
            </View>
            <View style={styles.contentContainer}>{children}</View>
        </View>
    );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'flex-start',
  },
  iconContainer: {
    marginRight: 12,
  },
  titleContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 15,
    paddingLeft: 15
  },
  contentContainer: {
    width: '100%',
    flex: 1
  },
});