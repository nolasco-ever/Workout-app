import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView } from 'react-native';
import { colors } from '../../../colors';
import { WeekHeader } from '../../../components/calendars/weekHeader';
import { UserCardHeader } from '../../../components/cards/userCardHeader';
import { CustomText } from '../../../components/text/customText';

export const HomeScreen = () => {
    const appColors = colors();
    const [selectedDay, setSelectedDay] = useState(new Date().getDate());

    const handleDayPress = (dayNumber: number) => {
      setSelectedDay(dayNumber);
    };
  return (
    <SafeAreaView style={[styles.container, {backgroundColor: appColors.background}]}>
        <UserCardHeader
            profilePhoto='https://picsum.photos/200'
            welcomeMessage='Welcome back, Ever!'
        />
        <ScrollView style={{borderTopWidth: 1, borderColor: appColors.subtext}}>
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
    flex: 1
  },
  text: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center'
  },
});
