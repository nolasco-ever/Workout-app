import { IconProp } from '@fortawesome/fontawesome-svg-core';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, RefreshControl } from 'react-native';
import { colors } from '../../../colors';
import { tabIcons } from '../../../components/icons/icon-library';
import { CustomText } from '../../../components/text/customText';
import { WeekHeader } from '../../../components/calendars/weekHeader';
import { CustomGraph } from '../../../components/graphs/customGraph';
import { mockBenchPressData, mockDumbbellCurlData } from '../../../mocks/trainingDataMocks';
import { Section } from '../../../components/sections/Section';


export const StatsScreen = () => {
  const appColors = colors();
  const [selectedDay, setSelectedDay] = useState(new Date().getDate());

  const benchPressWeightData = mockBenchPressData.map(item => item.weight);
  const benchPressDates = mockBenchPressData.map(item => item.date);

  const dumbbellCurlWeightData = mockDumbbellCurlData.map(item => item.weight);
  const dumbbellCurlDates = mockDumbbellCurlData.map(item => item.date);

  const [refreshing, setRefreshing] = useState(false);

  const handleDayPress = (dayNumber: number) => {
    setSelectedDay(dayNumber);
  };


  return (
    <SafeAreaView style={[styles.container, {backgroundColor: appColors.background}]}>
      <WeekHeader
          selectedDay={selectedDay}
          onDayPress={handleDayPress}
        />
      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              // handle refresh
            }}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        <CustomText type='header' centered>{selectedDay}</CustomText>
          <CustomGraph
            yAxisData={benchPressWeightData}
            xAxisLabels={benchPressDates}
            type='bar'
            title='Bench Press'
          />

          <CustomGraph
            yAxisData={dumbbellCurlWeightData}
            xAxisLabels={dumbbellCurlDates}
            type='line'
            title='Dumbbell Curl'
          />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1
  }
});