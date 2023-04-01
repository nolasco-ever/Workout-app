import { IconProp } from '@fortawesome/fontawesome-svg-core';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView } from 'react-native';
import { colors } from '../../../colors';
import { tabIcons } from '../../../components/icons/icon-library';
import { CustomText } from '../../../components/text/customText';
import { WeekHeader } from '../../../components/calendars/weekHeader';


export const StatsScreen = () => {
  const appColors = colors();
  const [selectedDay, setSelectedDay] = useState(new Date().getDate());

  const handleDayPress = (dayNumber: number) => {
    setSelectedDay(dayNumber);
  };
  return (
    <SafeAreaView style={[styles.container, {backgroundColor: appColors.background}]}>
      <WeekHeader
          selectedDay={selectedDay}
          onDayPress={handleDayPress}
        />
      <ScrollView>
        <CustomText type='header' centered>{selectedDay}</CustomText>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1
  }
});