import { Image, RefreshControl, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native'
import React, { useRef, useState } from 'react'
import { colors } from '../../../../colors';
import { Section } from '../../../../components/sections/Section';
import { InformationCard } from '../../../../components/cards/informationCard';
import { InformationCardSmall } from '../../../../components/cards/informationCardSmall';
import { backSection, bicepsSection, chestSection, legsSection, shouldersSection, tricepsSection } from '../../../../config/customize-training-program-flow/selectYourWorkouts';
import { strengthTrainingTypesMock } from '../../../../mocks/selectionCardListMocks';
import { SearchBar } from '../../../../components/search-bar/searchBar';
import { ResultsList } from '../../../../components/search-bar/resultsList';
import { useScrollToTop } from '@react-navigation/native';
import { mockArticles } from '../../../../mocks/articleMocks';

export const ExploreScreen = ({navigation}: {navigation: any}) => {
    const appColors = colors();
    const exercisesArray = [
        chestSection.exercises, 
        tricepsSection.exercises, 
        bicepsSection.exercises, 
        backSection.exercises, 
        shouldersSection.exercises, 
        legsSection.exercises
    ]

    const [copyAmount, setCopyAmount] = useState(1);

    const handleSeeMore = () => {
        if (copyAmount < exercisesArray.length) {
            setCopyAmount(prev => prev+1)
        }
    }

    const [value, setValue] = useState<string>('');

    const [refreshing, setRefreshing] = useState(false);
    const scrollViewRef = useRef<ScrollView>(null);
    useScrollToTop(scrollViewRef);
    return (    
        <SafeAreaView style={{flex: 1, backgroundColor: appColors.background}}>
            <SearchBar
                value={value}
                onChangeText={setValue}
                onClear={() => setValue('')}
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
                style={{flex: 1}}
            >
                <Section title='Discover'>
                    {mockArticles.map((item, index) => (
                        <InformationCard
                            key={index}
                            imageSource={item.image}
                            title={item.title}
                            description={item.description}
                            onPress={() => navigation.navigate('articleScreen', {articleData: item})}
                        />
                    ))}
                </Section>
                <Section title='Learn' seeMore={copyAmount < exercisesArray.length} onPressSeeMore={handleSeeMore}>
                    <View style={{flexDirection: 'row', flexWrap: 'wrap',}}>
                        {exercisesArray.slice(0,copyAmount).flatMap((subArray, arraysIndex) =>
                            subArray.map((item, index) => {
                                const videoId = item.link.match(/(?:https?:\/\/)?(?:www\.)?(?:youtube\.com|youtu\.be)\/(?:watch\/|embed\/|v\/|u\/\w\/|watch\?v=)?([^#\&\?]{11})/)?.[1];
                                const thumbnailUrl = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;

                                return (
                                    <InformationCardSmall
                                        key={item.link}
                                        title={item.name}
                                        imageSource={thumbnailUrl}
                                        size='s'
                                        onPress={() => 
                                            navigation.navigate(
                                                'tutorialScreen', 
                                                {
                                                    title: item.name,
                                                    videoLink: item.link,
                                                    steps: item.howToSteps,
                                                    muscleGroupWorkouts: exercisesArray[arraysIndex]
                                                }
                                            )
                                        }
                                    />
                                )
                            })    
                        )}
                    </View>
                </Section>
            </ScrollView>
        </SafeAreaView>
  )
}

const styles = StyleSheet.create({})