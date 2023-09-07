import React, { useRef, useState } from 'react';
import { StyleSheet, ScrollView, SafeAreaView, View, RefreshControl, NativeScrollEvent, NativeSyntheticEvent } from 'react-native';
import { colors } from '../../../../colors';
import { UserCardHeader } from '../../../../components/cards/userCardHeader';
import { ProgressCard } from '../../../../components/cards/progressCard';
import { Section } from '../../../../components/sections/Section';
import { generalIcons, tabIcons } from '../../../../components/icons/icon-library';
import { user1 } from '../../../../mocks/userMocks';
import { CustomGraph } from '../../../../components/graphs/customGraph';
import { mockBenchPressData, mockDumbbellCurlData } from '../../../../mocks/trainingDataMocks';
import { useScrollToTop } from '@react-navigation/native';
import { mockArticles } from '../../../../mocks/articleMocks';
import { Card } from '../../../../components/cards/Card';
import { statsScreenActivityLogListMock } from '../../../../mocks/listItemMocks';
import { ListItem } from '../../../../components/list-items/ListItem';
import { IconButton } from '../../../../components/buttons/IconButton';
import { chestSection } from '../../../../config/customize-training-program-flow/selectYourWorkouts';

export const HomeScreen = ({navigation, route}: {navigation: any, route: any}) => {
    const appColors = colors();

    const [refreshing, setRefreshing] = useState(false);

    const scrollViewRef = useRef<ScrollView>(null);
    useScrollToTop(scrollViewRef);

    return (
      <SafeAreaView style={[styles.container, {backgroundColor: appColors.background}]}>
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
              {statsScreenActivityLogListMock.map(item => (
                <IconButton
                  key={item.id}
                  icon={item.icon}
                  iconColor={item.color}
                  label={item.title}
                  onPress={() => navigation.navigate(item.navigateTo, {title: item.title, icon: item.icon})}
                />
              ))}
            </View>

            <Section title='Overview'>
              <View style={{flexDirection: 'row'}}>
                <ProgressCard
                  title='Water'
                  unit='oz'
                  icon={generalIcons.glassWater}
                  goalAmount={64}
                  currentAmount={48}
                  color='#397FDB'
                />
                <ProgressCard
                  title='Steps'
                  icon={generalIcons.personRunning}
                  goalAmount={1000}
                  currentAmount={682}
                />
              </View>
              <View style={{flexDirection: 'row'}}>
                <ProgressCard
                  title='Calories'
                  unit='kal'
                  goalAmount={2400}
                  currentAmount={1030}
                  type='circle'
                />
                <ProgressCard
                  title='Protein'
                  unit='g'
                  goalAmount={180}
                  currentAmount={127}
                  type='circle'
                  color='#BA812C'
                />
              </View>
            </Section>

            <Section title='For You'>
              <Section title='Articles' titleFontSize={14}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {mockArticles.map((item, index) => (
                    <Card
                      key={index}
                      imageSource={item.image}
                      title={item.title}
                      subtitle='Jenna Tolls | Sep. 7, 2023'
                      onPress={() => console.log('Pressed')}
                    />
                  ))}
                </ScrollView>
              </Section>

              <Section title='Videos' titleFontSize={14}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {chestSection.exercises.map((item, index) => {
                    const videoId = item.link.match(/(?:https?:\/\/)?(?:www\.)?(?:youtube\.com|youtu\.be)\/(?:watch\/|embed\/|v\/|u\/\w\/|watch\?v=)?([^#\&\?]{11})/)?.[1];
                    const thumbnailUrl = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;

                    return (
                        <Card
                            key={index}
                            title={item.name}
                            imageSource={thumbnailUrl}
                            imageText={item.length}
                            onPress={() => 
                                navigation.navigate(
                                    'tutorialScreen', 
                                    {
                                        title: item.name,
                                        videoLink: item.link,
                                        steps: item.howToSteps,
                                        muscleGroupWorkouts: chestSection.exercises
                                    }
                                )
                            }
                        />
                    )   
                  })}
                </ScrollView>
              </Section>
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
