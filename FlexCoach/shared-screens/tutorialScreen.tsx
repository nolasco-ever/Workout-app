import { Dimensions, Image, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import React from 'react'
import { colors } from '../colors'
import { ScrollView } from 'react-native-gesture-handler';
import { CustomText } from '../components/text/customText';
import { YouTubeVideo } from '../components/utils/youtubeVideo';
import { Section } from '../components/sections/Section';
import { TransitionPresets, createStackNavigator } from '@react-navigation/stack';
import { Button } from '../components/buttons/button';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { generalIcons } from '../components/icons/icon-library';
import { InformationCardSmall } from '../components/cards/informationCardSmall';
import { mockArticles } from '../mocks/articleMocks';
import { InformationCard } from '../components/cards/informationCard';
import { NavigationProp, StackActions, useNavigation } from '@react-navigation/native';
import { ExploreStackParams } from '../screens/Tabs/Explore/ExploreStack';

export const TutorialScreen = ({route}: {route: any}) => {
  const navigation = useNavigation<NavigationProp<ExploreStackParams>>();
  const {title, videoLink, steps, muscleGroupWorkouts} = route.params;
  const appColors = colors();
  const screenWidth = Dimensions.get('window').width

  const Stack = createStackNavigator();

  const InstructionsStack = () => {
    const InstructionsScreen = () => {
      return (
        <ScrollView style={{backgroundColor: appColors.background}} contentContainerStyle={{padding: 10}}>
              <CustomText type='header'>{title}</CustomText>
              {steps.map((step: string, index: number) => (
                <View key={index} style={{margin: 10}}>
                  <CustomText>{index+1}. {step}</CustomText>
                </View>
              ))}
          </ScrollView>
      );
    }

    return (
      <Stack.Navigator
      screenOptions={{
        headerShown: false
      }}
      initialRouteName='mainScreen'
    >
      <Stack.Screen
        name="instructions"
        component={InstructionsScreen}
        options={{
          headerShown: true,
          headerStyle: {backgroundColor: appColors.background},
          headerTitleStyle: {color: appColors.text},
          headerTitle: 'Step-by-step',
          headerBackTitleVisible: false,
          headerBackImage: () => (
            <FontAwesomeIcon
              icon={generalIcons.xMark}
              color={appColors.icon}
              size={25}
              style={{marginLeft: 10}}
            />
          )
        }}
      />
    </Stack.Navigator>
    );
  }

  const MainScreen = () => {
    return (
      <ScrollView style={{backgroundColor: appColors.background, flex: 1}}>
        <Button
          type='outline'
          label='Step-by-step instructions'
          onPress={() => (navigation as any).navigate('instructionsStack')}
        />
        <Section title='Related'>
          {mockArticles.slice(0,3).map((item, index) => (
            <InformationCard
              key={index}
              imageSource={item.image}
              title={item.title}
              description={item.description}
              onPress={() => navigation.navigate('ArticleScreen', {articleData: item})}
            />
          ))}
          <View style={{flexDirection: 'row'}}>
            {muscleGroupWorkouts.filter((item: { name: string; link: string; howToSteps: string[] }) => item.name !== title)
              .slice(0,2)
              .map((item: { name: string; link: string; howToSteps: string[] }, index: number) => {
                const videoId = item.link.match(/(?:https?:\/\/)?(?:www\.)?(?:youtube\.com|youtu\.be)\/(?:watch\/|embed\/|v\/|u\/\w\/|watch\?v=)?([^#\&\?]{11})/)?.[1];
                const thumbnailUrl = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
                return (
                  <InformationCardSmall
                    key={index}
                    imageSource={thumbnailUrl}
                    title={item.name}
                    onPress={() => 
                      navigation.dispatch(StackActions.replace(
                        'TutorialScreen', 
                        {title: item.name, videoLink: item.link, steps: item.howToSteps, muscleGroupWorkouts: muscleGroupWorkouts}
                      ))
                    }
                  />
                );
              })}
          </View>
        </Section>
      </ScrollView>
    );
  }

  return (
    <SafeAreaView style={{flex: 1, backgroundColor:  appColors.background}}>
        <YouTubeVideo
            videoLink={videoLink}
        />
        <Stack.Navigator
          screenOptions={{
            headerShown: false
          }}
          initialRouteName='mainScreen'
        >
          <Stack.Screen
            name="mainScreen"
            component={MainScreen}
          />
          <Stack.Screen
            name="instructionsStack"
            component={InstructionsStack}
            options={{
              headerShown: false,
              ...TransitionPresets.ModalSlideFromBottomIOS
            }}
          />
        </Stack.Navigator>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({})