import React from 'react';
import { StyleSheet, ScrollView, SafeAreaView, View } from 'react-native';
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

export const HomeScreen = () => {
    const appColors = colors();
  return (
    <SafeAreaView style={[styles.container, {backgroundColor: appColors.background}]}>
        <UserCardHeader
            profilePhoto={user1.profilePicture}
            welcomeMessage={`Welcome back, ${user1.firstName}`}
        />
        <ScrollView style={{borderTopWidth: 1, borderColor: appColors.subtext}}>
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
