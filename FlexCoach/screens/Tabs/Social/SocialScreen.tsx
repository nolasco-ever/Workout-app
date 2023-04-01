import { IconProp } from '@fortawesome/fontawesome-svg-core';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import React from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import { colors } from '../../../colors';
import { tabIcons } from '../../../components/icons/icon-library';
import { CustomText } from '../../../components/text/customText';

const appColors = colors();

export const SocialScreen = () => {
  return (
    <SafeAreaView style={styles.container}>
        <FontAwesomeIcon icon={tabIcons.social as IconProp} color={appColors.inactive} size={50}/>
        <CustomText type='header' centered>Social</CustomText>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: appColors.background
  },
  text: {
    fontSize: 24,
    fontWeight: 'bold',
    color: appColors.text
  },
});