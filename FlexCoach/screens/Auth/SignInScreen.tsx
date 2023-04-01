import React from 'react';
import { NavigationProp, ParamListBase } from '@react-navigation/native';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';
import { colors } from '../../colors';
import { CustomText } from '../../components/text/customText';

type SignInScreenProps = {
    navigation: NavigationProp<ParamListBase>;
  };
const appColors = colors();

export const SignInScreen = ({ navigation }: SignInScreenProps) => {
  return (
    <SafeAreaView style={styles.container}>
        <TouchableOpacity onPress={() => navigation.navigate('Tabs')}>
        <CustomText type='header' centered>Sign In</CustomText>
        </TouchableOpacity>
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