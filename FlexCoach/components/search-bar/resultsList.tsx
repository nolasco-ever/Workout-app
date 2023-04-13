import React from 'react'
import { Keyboard, ScrollView, StyleSheet } from 'react-native'
import { colors } from '../../colors'
import { ResultItem } from './resultItem';
import { ListItem } from '../list-items/ListItem';
import { generalIcons, tabIcons } from '../icons/icon-library';
import { Section } from '../sections/Section';
import { strengthTrainingTypesMock } from '../../mocks/selectionCardListMocks';
import { InformationCard } from '../cards/informationCard';
import { chestSection, tricepsSection, bicepsSection, backSection, shouldersSection, legsSection } from '../../config/customize-training-program-flow/selectYourWorkouts';

export const ResultsList = ({navigation}: {navigation: any}) => {
    const appColors = colors();
    const exercisesArray = [
        chestSection.exercises.slice(0,2), 
        tricepsSection.exercises.slice(0,2), 
        bicepsSection.exercises.slice(0,2), 
        backSection.exercises.slice(0,2), 
        shouldersSection.exercises.slice(0,2), 
        legsSection.exercises.slice(0,2)
    ]

    return (
        <ScrollView onScrollBeginDrag={() => Keyboard.dismiss()} style={[styles.container, {backgroundColor: appColors.background}]}>
            <ListItem
                icon={tabIcons.explore}
                title='Title'
            />
            <ListItem
                icon={tabIcons.explore}
                title='Title'
            />
            <ListItem
                icon={tabIcons.explore}
                title='Title'
            />
            <ListItem
                icon={tabIcons.explore}
                title='Title'
            />
            <Section icon={generalIcons.personTeaching} title='Tutorials' titleFontSize={20}>                
                {exercisesArray.flatMap((subArray, arraysIndex) =>
                    subArray.map((item, index) => {
                        const videoId = item.link.match(/(?:https?:\/\/)?(?:www\.)?(?:youtube\.com|youtu\.be)\/(?:watch\/|embed\/|v\/|u\/\w\/|watch\?v=)?([^#\&\?]{11})/)?.[1];
                        const thumbnailUrl = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;

                        return (
                            <ResultItem
                                key={item.link}
                                title={item.name}
                                description={item.howToSteps[0]}
                                imageSource={thumbnailUrl}
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
            </Section>
            <Section icon={generalIcons.book} title="Articles" titleFontSize={20}>
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
        </ScrollView>
    )
}

const styles = StyleSheet.create({
    container: {
        height: '100%',
        width: '100%'
    }
})