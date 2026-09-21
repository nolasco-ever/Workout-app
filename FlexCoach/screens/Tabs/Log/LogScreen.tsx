import { Icon } from '../../../components/icons/Icon';
import { SafeAreaView } from 'react-native-safe-area-context';
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../../../colors';
import { tabIcons } from '../../../components/icons/icon-library';
import { CustomText } from '../../../components/text/customText';


export const LogScreen = () => {
  const appColors = colors();
  return (
    <SafeAreaView style={[styles.container, {backgroundColor: appColors.background}]}>
      <Icon icon={tabIcons.log} color={appColors.inactive} size={50}/>
      <CustomText type='header' centered>Log</CustomText>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  }
});