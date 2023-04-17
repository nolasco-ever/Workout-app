import React, { useRef } from 'react';
import { View, Image, ScrollView, Animated, StyleSheet, Dimensions, Text, TouchableOpacity } from 'react-native';
import { CustomText } from '../components/text/customText';
import { colors } from '../colors';
import { Section } from '../components/sections/Section';
import { mockArticles } from '../mocks/articleMocks';

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

            <View style={[styles.contentContainer, {backgroundColor: appColors.background}]}>
                <CustomText type='header'>{articleData.title}</CustomText>
                <Text style={[styles.text, {color: appColors.subtext}]}>{articleData.date}</Text>
                <CustomText type='subheader'>{articleData.description}</CustomText>
                <CustomText>
                    {articleData.content}
                </CustomText>
            </View>

            <Section title='Related'>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {mockArticles.filter((item: { id: number; date: string; title: string; image: string; content: string, description: string }) => item.title !== articleData.title)
                  .map((item: { id: number; date: string; title: string; image: string; content: string, description: string }) => {
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
    padding: 20,
  },
  text: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 10
  }
});