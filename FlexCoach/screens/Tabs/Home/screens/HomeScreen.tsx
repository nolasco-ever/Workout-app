import React, { useRef, useState } from 'react';
import { StyleSheet, ScrollView, SafeAreaView, View, RefreshControl } from 'react-native';
import { colors } from '../../../../colors';
import { UserCardHeader } from '../../../../components/cards/userCardHeader';
import { ProgressCard } from '../../../../components/cards/progressCard';
import { Section } from '../../../../components/sections/Section';
import { generalIcons } from '../../../../components/icons/icon-library';
import { user1 } from '../../../../mocks/userMocks';
import { CustomGraph } from '../../../../components/graphs/customGraph';
import { mockBenchPressData, mockDumbbellCurlData } from '../../../../mocks/trainingDataMocks';
import { useScrollToTop } from '@react-navigation/native';
import { mockArticles } from '../../../../mocks/articleMocks';
import { Card } from '../../../../components/cards/Card';
import { statsScreenActivityLogListMock } from '../../../../mocks/listItemMocks';
import { ListItem } from '../../../../components/list-items/ListItem';

export const HomeScreen = ({navigation}: {navigation: any}) => {
    const appColors = colors();

    const benchPressWeightData = mockBenchPressData.map(item => item.weight);
    const benchPressDates = mockBenchPressData.map(item => item.date);

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
          <CustomGraph
            yAxisData={benchPressWeightData}
            xAxisLabels={benchPressDates}
            type='bar'
            title='Bench Press'
          />

          <Section title='Activity Log' icon={generalIcons.personRunning}>
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

          <Section title='Overview'>
            <View style={{flexDirection: 'row'}}>
              <ProgressCard
                title='Calories'
                goalAmount={2400}
                currentAmount={1030}
                type='circle'
              />
              <ProgressCard
                title='Protein'
                goalAmount={180}
                currentAmount={127}
                type='circle'
              />
            </View>
            <ProgressCard
              title='Water (oz)'
              goalAmount={64}
              currentAmount={48}
            />
            <ProgressCard
              title='Steps'
              goalAmount={1000}
              currentAmount={682}
            />
          </Section>

          <Section title='For You' seeMore onPressSeeMore={() => navigation.navigate('Explore')}>
            {mockArticles.slice(4,5).map((item, index) => (
              <Card
                key={index}
                imageSource={item.image}
                imageText='3:14'
                title={item.title}
                size='l'
                onPress={() => console.log('Pressed')}
              />
            ))}
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {mockArticles.map((item, index) => (
                <Card
                  key={index}
                  imageSource={item.image}
                  imageText='Read'
                  title={item.title}
                  onPress={() => console.log('Pressed')}
                />
              ))}
            </ScrollView>
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
