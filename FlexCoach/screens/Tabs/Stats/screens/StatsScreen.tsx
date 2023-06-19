import { IconProp } from '@fortawesome/fontawesome-svg-core';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, RefreshControl } from 'react-native';
import { colors } from '../../../../colors';
import { generalIcons, tabIcons } from '../../../../components/icons/icon-library';
import { CustomText } from '../../../../components/text/customText';
import { WeekHeader } from '../../../../components/calendars/weekHeader';
import { CustomGraph } from '../../../../components/graphs/customGraph';
import { mockBenchPressData, mockDumbbellCurlData } from '../../../../mocks/trainingDataMocks';
import { Section } from '../../../../components/sections/Section';
import { ListItem } from '../../../../components/list-items/ListItem';
import { useScrollToTop } from '@react-navigation/native';
import { statsScreenActivityLogListMock } from '../../../../mocks/listItemMocks';


export const StatsScreen = ({navigation}: {navigation: any}) => {
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

  const scrollViewRef = useRef<ScrollView>(null);
  useScrollToTop(scrollViewRef);
  return (
    <SafeAreaView style={[styles.container, {backgroundColor: appColors.background}]}>
      <WeekHeader
          selectedDay={selectedDay}
          onDayPress={handleDayPress}
        />
      <ScrollView
        ref={scrollViewRef}
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
        <View>
          <CustomGraph
            yAxisData={benchPressWeightData}
            xAxisLabels={benchPressDates}
            type='bar'
            title='Bench Press'
          />
          <Section title='Activity Log' icon={generalIcons.personRunning} iconColor={appColors.primary}>
            {statsScreenActivityLogListMock.map(item => (
              <ListItem
                key={item.id}
                title={item.title}
                description={item.description}
                icon={item.icon}
                onPress={() => navigation.navigate(item.navigateTo, {title: item.title, icon: item.icon})}
              />
            ))}
          </Section>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1
  }
});