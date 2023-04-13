import { IconProp } from '@fortawesome/fontawesome-svg-core';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import React, { FC } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../../colors';
import { CustomText } from '../text/customText';
import { TouchableOpacity } from 'react-native-gesture-handler';

interface SectionProps {
  title: string;
  titleFontSize?: number;
  icon?: string;
  iconColor?: string;
  children: React.ReactNode,
  centered?: boolean;
  seeMore?: boolean;
  onPressSeeMore?: () => void;
}

export const Section: FC<SectionProps> = ({ title, titleFontSize, icon, iconColor, children, centered=false, seeMore=false, onPressSeeMore }) => {
    const appColors = colors();
    return (
        <View>
            <View style={[styles.titleContainer, {justifyContent: centered ? 'center' : 'flex-start'}]}>
                {icon && (
                    <View style={styles.iconContainer}>
                        <FontAwesomeIcon 
                            icon={icon as IconProp}
                            color={iconColor ? iconColor : appColors.icon}
                            size={25}
                        />
                    </View>
                )}
                {titleFontSize ? (
                  <Text style={{color: appColors.text, fontWeight: 'bold', fontSize: titleFontSize}}>{title}</Text>
                ) : (
                  <CustomText type='header'>{title}</CustomText>
                )}
            </View>
            <View style={styles.contentContainer}>{children}</View>
            {seeMore && onPressSeeMore && (
              <TouchableOpacity onPress={() => onPressSeeMore()}>
                <CustomText type='subheader' centered>See More</CustomText>
              </TouchableOpacity>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
  iconContainer: {
    marginRight: 12,
  },
  titleContainer: {
    flex: 1,
    flexDirection: 'row',
    paddingTop: 15,
    paddingLeft: 15
  },
  contentContainer: {
    width: '100%',
    flex: 1
  },
});