import React, { useState } from 'react';
import { StyleSheet, ScrollView, SafeAreaView, View, RefreshControl } from 'react-native';
import { colors } from '../../../colors';
import { UserCardHeader } from '../../../components/cards/userCardHeader';
import { ProgressCard } from '../../../components/cards/progressCard';
import { Section } from '../../../components/sections/Section';
import { generalIcons } from '../../../components/icons/icon-library';
import { ListCard } from '../../../components/cards/listCard';
import { mockDietList, mockWorkoutList } from '../../../mocks/listMocks';
import PostCard from '../../../components/cards/postCard';
import { ProgressCardSquare } from '../../../components/cards/progressCardSquare';
import { user1 } from '../../../mocks/userMocks';
import { CustomGraph } from '../../../components/graphs/customGraph';
import { mockBenchPressData, mockDumbbellCurlData } from '../../../mocks/trainingDataMocks';
import { InformationCard } from '../../../components/cards/informationCard';
import { strengthTrainingTypesMock } from '../../../mocks/selectionCardListMocks';

export const HomeScreen = () => {
    const appColors = colors();

    const benchPressWeightData = mockBenchPressData.map(item => item.weight);
    const benchPressDates = mockBenchPressData.map(item => item.date);
  
    const dumbbellCurlWeightData = mockDumbbellCurlData.map(item => item.weight);
    const dumbbellCurlDates = mockDumbbellCurlData.map(item => item.date);

    const [refreshing, setRefreshing] = useState(false);
  return (
    <SafeAreaView style={[styles.container, {backgroundColor: appColors.background}]}>
        <UserCardHeader
            profilePhoto={user1.profilePicture}
            welcomeMessage={`Welcome back, ${user1.firstName}`}
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
          style={{
            borderTopWidth: 1,
            borderColor: appColors.subtext
          }}
        >
          <Section title='Explore' seeMore onPressSeeMore={() => console.log(`Pressed 'See More'`)}>
            {strengthTrainingTypesMock.map((item, index) => (
              <InformationCard
                key={index}
                imageSource={item.image}
                title={item.title}
                description={item.description}
                onPress={() => console.log('Pressed Card')}
              />
            ))}
          </Section>
          <Section title='Overview'>
            <View style={{flexDirection: 'row'}}>
              <ProgressCardSquare
                title='Steps'
                goalAmount={10000}
                currentAmount={5734}
              />
              <ProgressCardSquare
                title='Water (cups)'
                goalAmount={10}
                currentAmount={8}
              />
            </View>
            <ProgressCard
              title='Calories'
              goalAmount={2400}
              currentAmount={1030}
            />
            <ProgressCard
              title='Protein (g)'
              goalAmount={180}
              currentAmount={127}
            />
          </Section>

          <Section title='Today' icon={generalIcons.calendarDay}>
            <ListCard
              title={mockWorkoutList.title}
              items={mockWorkoutList.items}
            />
            <ListCard
              title={mockDietList.title}
              items={mockDietList.items}
            />
          </Section>

          <Section title='Personal Records' icon={generalIcons.trophy}>
            <CustomGraph
              title='Bench Press'
              type='line'
              yAxisData={benchPressWeightData}
              xAxisLabels={benchPressDates}
            />
            <CustomGraph
              title='Overhead Barbell Press'
              type='bar'
              yAxisData={dumbbellCurlWeightData}
              xAxisLabels={dumbbellCurlDates}
            />
          </Section>

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
