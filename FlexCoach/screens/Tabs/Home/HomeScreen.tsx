import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView } from 'react-native';
import { colors } from '../../../colors';
import { WeekHeader } from '../../../components/calendars/weekHeader';
import { UserCardHeader } from '../../../components/cards/userCardHeader';
import { CustomText } from '../../../components/text/customText';

const appColors = colors();

export const HomeScreen = () => {
    const [selectedDay, setSelectedDay] = useState(new Date().getDate());

    const handleDayPress = (dayNumber: number) => {
        setSelectedDay(dayNumber);
      };
  return (
    <SafeAreaView style={styles.container}>
        <UserCardHeader
            profilePhoto='https://picsum.photos/200'
            welcomeMessage='Welcome back, Ever!'
        />
        <ScrollView style={{borderTopWidth: 1, borderColor: appColors.subtext}}>
            {/* <CustomText type='header' centered>Home</CustomText> */}
            <WeekHeader
                selectedDay={selectedDay}
                onDayPress={handleDayPress}
            />
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
