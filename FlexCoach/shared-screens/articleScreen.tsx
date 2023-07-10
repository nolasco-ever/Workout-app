import React, { useRef } from 'react';
import { View, Image, ScrollView, Animated, StyleSheet, Dimensions, Text, TouchableOpacity } from 'react-native';
import { CustomText } from '../components/text/customText';
import { colors } from '../colors';
import { Section } from '../components/sections/Section';
import { mockArticles } from '../mocks/articleMocks';
import { AlertBanner } from '../components/banners/alertBanner';
import { AuthorCard } from './components/authorCard';
import { InformationCard } from '../components/cards/informationCard';
import { UserFeedbackCard } from './components/userFeedbackCard';

export const ArticleScreen = ({navigation, route}: {navigation: any, route: any}) => {
    const { articleData } = route.params;
    const appColors = colors();
    const scrollY = useRef(new Animated.Value(0)).current;

    const screenHeight = Dimensions.get('window').height;
    const screenWidth = Dimensions.get('window').width;

    return (
        <View style={[styles.container, {backgroundColor: appColors.background}]}>
        <Animated.ScrollView
            onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            {useNativeDriver: true}
            )}
            scrollEventThrottle={16}
        >
            <View
            style={[
                {height: screenHeight/4}
            ]}
            >
                <Animated.Image 
                    source={{ uri: articleData.image }}
                    style={[
                        styles.image, 
                        {
                            transform: [
                                {translateY: scrollY.interpolate({
                                    inputRange: [-0.5, 0, 2],
                                    outputRange: [-0.5, 0, 1]
                                })},
                                {
                                    scale: scrollY.interpolate({
                                        inputRange: [-(screenHeight/3), 0, (screenHeight/3), (screenHeight/3)+1],
                                        outputRange: [2, 1, 1, 1]
                                    })
                                },
                            ]
                        }
                    ]}
                />
            </View>
            
            <View style={{backgroundColor: appColors.background}}>
              <View style={styles.contentContainer}>
                <View style={[styles.titleContainer, {borderColor: appColors.lightGrey}]}>
                    <CustomText type='header'>{articleData.title}</CustomText>
                    {/* <Text style={[styles.text, {color: appColors.subtext}]}>{articleData.date}</Text> */}
                    {/* <CustomText type='subheader'>{articleData.description}</CustomText> */}
                    <AuthorCard
                      photo={articleData.authorData.profilePhoto}
                      name={articleData.authorData.name}
                      date={articleData.authorData.date}
                      // viewCount={articleData.authorData.viewCount}
                    />
                </View>
                <AlertBanner
                message='This is an AI generated article. It is only a placeholder and is not intended for real use.'
                type='warning'
              />
                  <CustomText>
                      {articleData.content}
                  </CustomText>
              </View>
            </View>

            <UserFeedbackCard
            
            />

            <Section title='Related'>
              {mockArticles.slice(0,2).map((item, index) => {
                return (
                  <InformationCard
                    key={index}
                    imageSource={item.image}
                    title={item.title}
                    description={item.description}
                    onPress={() => 
                      navigation.replace(
                        'articleScreen', 
                        {articleData: item}
                      )
                    }
                  />
                );
              })}
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {mockArticles.filter((item: { id: number; title: string; image: string; content: string, description: string }) => item.title !== articleData.title)
                  .map((item: { id: number; title: string; image: string; content: string, description: string }) => {
                    return (
                      <TouchableOpacity
                        key={item.id} 
                        style={{margin: 10, width: screenWidth/2}} 
                        onPress={() => 
                          navigation.replace(
                            'articleScreen', 
                            {articleData: item}
                          )
                        }
                      >
                        <Image
                          source={{
                            uri: item.image
                          }}
                          style={{width: '100%', height: screenWidth/4, marginBottom: 5, borderRadius: 5}}
                        />
                        <Text numberOfLines={2} style={{color: appColors.text, fontSize: 16}}>{item.title}</Text>
                      </TouchableOpacity>
                    );
                  })}
              </ScrollView>
            </Section>
        </Animated.ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  image: {
    flex: 1,
    resizeMode: 'cover',
  },
  contentContainer: {
    padding: 10,
  },
  titleContainer: {
    borderBottomWidth: 1
  },
  text: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 10
  }
});