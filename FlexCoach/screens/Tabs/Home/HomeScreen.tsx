import React from 'react';
import { StyleSheet, ScrollView, SafeAreaView } from 'react-native';
import { colors } from '../../../colors';
import { UserCardHeader } from '../../../components/cards/userCardHeader';
import { TrackerCard } from '../../../components/cards/trackerCard';
import { Section } from '../../../components/sections/Section';
import { generalIcons } from '../../../components/icons/icon-library';
import { ListCard } from '../../../components/cards/listCard';
import { mockDietList, mockWorkoutList } from '../../../mocks/listMocks';

export const HomeScreen = () => {
    const appColors = colors();
  return (
    <SafeAreaView style={[styles.container, {backgroundColor: appColors.background}]}>
        <UserCardHeader
            profilePhoto='https://picsum.photos/200'
            welcomeMessage='Welcome back, Ever!'
        />
        <ScrollView style={{borderTopWidth: 1, borderColor: appColors.subtext}}>
          <Section title="Nutrition Tracker" icon={generalIcons.heart} iconColor='red'>
            <TrackerCard
              title='Calories'
              goalAmount={2400}
              currentAmount={1030}
            />
            <TrackerCard
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
