import { Dimensions, Image, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import React from 'react'
import { colors } from '../colors'
import { ScrollView } from 'react-native-gesture-handler';
import { CustomText } from '../components/text/customText';
import { YouTubeVideo } from '../components/utils/youtubeVideo';
import { Section } from '../components/sections/Section';

export const TutorialScreen = ({navigation, route}: {navigation: any, route: any}) => {
  const {title, videoLink, steps, muscleGroupWorkouts} = route.params;
  const appColors = colors();
  const screenWidth = Dimensions.get('window').width

  return (
    <SafeAreaView style={{flex: 1, backgroundColor:  appColors.background}}>
        <YouTubeVideo
            videoLink={videoLink}
        />
        <ScrollView contentContainerStyle={{padding: 10}}>
            <CustomText type='header'>{title}</CustomText>
            {steps.map((step: string, index: number) => (
              <View key={index} style={{margin: 10}}>
                <CustomText>{index+1}. {step}</CustomText>
              </View>
            ))}

            <Section title='Related'>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {muscleGroupWorkouts.filter((item: { name: string; link: string; howToSteps: string[] }) => item.name !== title)
                  .map((item: { name: string; link: string; howToSteps: string[] }, index: number) => {
                    const videoId = item.link.match(/(?:https?:\/\/)?(?:www\.)?(?:youtube\.com|youtu\.be)\/(?:watch\/|embed\/|v\/|u\/\w\/|watch\?v=)?([^#\&\?]{11})/)?.[1];
                    const thumbnailUrl = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
                    return (
                      <TouchableOpacity
                        key={index} 
                        style={{margin: 10, width: screenWidth/2}} 
                        onPress={() => 
                          navigation.replace(
                            'tutorialScreen', 
                            {title: item.name, videoLink: item.link, steps: item.howToSteps, muscleGroupWorkouts: muscleGroupWorkouts}
                          )
                        }
                      >
                        <Image
                          source={{
                            uri: thumbnailUrl
                          }}
                          style={{width: '100%', height: screenWidth/4, marginBottom: 5, borderRadius: 5}}
                        />
                        <Text numberOfLines={2} style={{color: appColors.text, fontSize: 16}}>{item.name}</Text>
                      </TouchableOpacity>
                    );
                  })}
              </ScrollView>
            </Section>
        </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({})