import { IconProp } from '@fortawesome/fontawesome-svg-core';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import React from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import { colors } from '../colors';
import { tabIcons } from '../components/icons/icon-library';
import { CustomText } from '../components/text/customText';

export const PlaceholderScreen = ({ route }: {route: any}) => {
  const { title, icon } = route.params;
  const appColors = colors();
  return (
    <SafeAreaView style={[styles.container, {backgroundColor: appColors.background}]}>
      <View style={{justifyContent: 'center', alignItems: 'center'}}>
        <FontAwesomeIcon icon={icon as IconProp} color={appColors.inactive} size={50} style={{marginBottom: 10}}/>
        <CustomText type='header' centered>{title}</CustomText>
      </View>
      <View style={{padding: 15}}>
        <CustomText type='subheader' centered>This screen is currently under construction 👷‍♂️🔨</CustomText>
      </View>
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