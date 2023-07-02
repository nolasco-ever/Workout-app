import React, { useRef, useState } from 'react';
import { StyleSheet, ScrollView, SafeAreaView, View, RefreshControl } from 'react-native';
import { colors } from '../../../colors';
import { UserCardHeader } from '../../../components/cards/userCardHeader';
import { ProgressCard } from '../../../components/cards/progressCard';
import { Section } from '../../../components/sections/Section';
import { generalIcons } from '../../../components/icons/icon-library';
import { ProgressCardSquare } from '../../../components/cards/progressCardSquare';
import { user1 } from '../../../mocks/userMocks';
import { CustomGraph } from '../../../components/graphs/customGraph';
import { mockBenchPressData, mockDumbbellCurlData } from '../../../mocks/trainingDataMocks';
import { InformationCard } from '../../../components/cards/informationCard';
import { useScrollToTop } from '@react-navigation/native';
import { mockArticles } from '../../../mocks/articleMocks';
import { ActionButton } from '../../../components/buttons/actionButton';
import { Card } from '../../../components/cards/Card';

export const HomeScreen = ({navigation}: {navigation: any}) => {
    const appColors = colors();

    const benchPressWeightData = mockBenchPressData.map(item => item.weight);
    const benchPressDates = mockBenchPressData.map(item => item.date);
  
    const dumbbellCurlWeightData = mockDumbbellCurlData.map(item => item.weight);
    const dumbbellCurlDates = mockDumbbellCurlData.map(item => item.date);

    const [refreshing, setRefreshing] = useState(false);

    const scrollViewRef = useRef<ScrollView>(null);
    useScrollToTop(scrollViewRef);
  return (
    <SafeAreaView style={[styles.container, {backgroundColor: appColors.background}]}>
        <UserCardHeader
            profilePhoto={user1.profilePicture}
            welcomeMessage={`Welcome back, ${user1.firstName}`}
            navigation={navigation}
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
          <ActionButton
            navigation={navigation}
            icon={generalIcons.dumbbell}
            message='Tap here to begin your training program!'
          />
          <Section title='For You' seeMore onPressSeeMore={() => navigation.navigate('Explore')}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {mockArticles.map((item, index) => (
                <Card
                  key={index}
                  imageSource={item.image}
                  imageText='Read'
                  title={item.title}
                  description={index % 2 === 0 ? item.description : undefined}
                  onPress={() => console.log('Pressed')}
                />
              ))}
            </ScrollView>
            {mockArticles.slice(4,5).map((item, index) => (
              <Card
                key={index}
                imageSource={item.image}
                imageText='3:14'
                title={item.title}
                size='l'
                description={item.description}
                onPress={() => console.log('Pressed')}
              />
            ))}
            {mockArticles.slice(2,4).map((item, index) => (
              <InformationCard
                key={index}
                imageSource={item.image}
                title={item.title}
                description={item.description}
                onPress={() => console.log('Pressed')}
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
