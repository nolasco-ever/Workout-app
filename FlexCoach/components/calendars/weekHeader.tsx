import React, { useState } from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import { DayCard } from './dayCard';

interface WeekHeaderProps {
    selectedDay: number;
    onDayPress: (dayNumber: number) => void;
  }

export const WeekHeader = ({selectedDay, onDayPress}: WeekHeaderProps) => {
  const screenWidth = Dimensions.get('window').width;
  // Create an array of the day names starting from Sunday to Saturday
  const weekDayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const daysOfWeek = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - date.getDay() + i);
    const dayNumber = date.getDate();
    const dayOfWeekIndex = date.getDay();
    const dayName = weekDayNames[dayOfWeekIndex];

    const currentDate = new Date();
    const isToday = date.setHours(0,0,0,0) === currentDate.setHours(0,0,0,0);
    return { dayNumber, dayName, isToday };
  });

  return (
    <View style={[styles.row, {height: screenWidth / 5,}]}>
      {daysOfWeek.map(({ dayNumber, dayName, isToday }, index) => (
        <DayCard
            key={index} 
            number={dayNumber} 
            dayName={dayName} 
            isToday={isToday} 
            onPress={() => onDayPress(dayNumber)}
            isSelected={dayNumber === selectedDay}
        />
      ))}
  </View>
  );
}

const styles = StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-around',
      marginVertical: 10,
    },
  });