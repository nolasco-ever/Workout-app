import React, { useRef, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StyleSheet, ScrollView, View, RefreshControl } from 'react-native';
import { colors } from '../../../../colors';
import { ProgressCard } from '../../../../components/cards/progressCard';
import { Section } from '../../../../components/sections/Section';
import { generalIcons } from '../../../../components/icons/icon-library';
import { NavigationProp, useNavigation, useScrollToTop } from '@react-navigation/native';
import { IconButton } from '../../../../components/buttons/IconButton';
import { HomeStackParams } from '../HomeStack';

export const HomeScreen = () => {
    const navigation = useNavigation<NavigationProp<HomeStackParams>>();

    const appColors = colors();

    const [refreshing, setRefreshing] = useState(false);

    const scrollViewRef = useRef<any>(null);
    useScrollToTop(scrollViewRef);

    return (
      <SafeAreaView edges={['left', 'right']} style={[styles.container, {backgroundColor: appColors.background}]}>
          <ScrollView
            ref={scrollViewRef}
            scrollEventThrottle={16}
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
            <View style={{flexDirection: 'row', justifyContent: 'space-between', padding: 10}}>
              <IconButton
                  icon={generalIcons.dumbbell}
                  iconColor={appColors.accent}
                  label="Workouts"
                  onPress={() => navigation.navigate("WorkoutOverviewScreen")}
              />
              <IconButton
                  icon={generalIcons.simpleChart}
                  label="Progress"
                  onPress={() => navigation.navigate("PlaceholderScreen", { title: 'Progress' })}
              />
            </View>

            <Section title='Overview'>
              <View style={{flexDirection: 'row'}}>
                <ProgressCard
                  title='Steps'
                  icon={generalIcons.personRunning}
                  goalAmount={1000}
                  currentAmount={682}
                />
              </View>
            </Section>

          </ScrollView>
      </SafeAreaView>
    );
}

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
});
