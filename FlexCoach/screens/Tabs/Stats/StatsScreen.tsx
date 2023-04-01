import { IconProp } from '@fortawesome/fontawesome-svg-core';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import React from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import { colors } from '../../../colors';
import { tabIcons } from '../../../components/icons/icon-library';
import { CustomText } from '../../../components/text/customText';


export const StatsScreen = () => {
  const appColors = colors();
  return (
    <SafeAreaView style={[styles.container, {backgroundColor: appColors.background}]}>
        <FontAwesomeIcon icon={tabIcons.stats as IconProp} color={appColors.inactive} size={50}/>
        <CustomText type='header' centered>Stats</CustomText>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  }
});