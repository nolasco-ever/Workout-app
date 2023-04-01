import React from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView } from 'react-native';
import { colors } from '../../../colors';
import { UserCardHeader } from '../../../components/cards/userCardHeader';
import { CustomText } from '../../../components/text/customText';

const appColors = colors();

export const HomeScreen = () => {
  return (
    <SafeAreaView style={styles.container}>
        <UserCardHeader
            profilePhoto='https://picsum.photos/200'
            welcomeMessage='Welcome back, Ever!'
        />
        <ScrollView style={{borderTopWidth: 1, borderColor: appColors.subtext}}>
            <CustomText type='header' centered>Home</CustomText>
        </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: appColors.background
  },
  text: {
    fontSize: 24,
    fontWeight: 'bold',
    color: appColors.text,
    textAlign: 'center'
  },
});
