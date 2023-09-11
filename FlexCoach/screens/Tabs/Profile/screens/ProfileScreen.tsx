import { IconProp } from '@fortawesome/fontawesome-svg-core';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, Image, Dimensions, ScrollView, RefreshControl } from 'react-native';
import { colors } from '../../../../colors';
import { generalIcons, tabIcons } from '../../../../components/icons/icon-library';
import { CustomText } from '../../../../components/text/customText';
import { user1 } from '../../../../mocks/userMocks';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import { ListItem } from '../../../../components/list-items/ListItem';
import { Section } from '../../../../components/sections/Section';
import { ProfileStackParams } from '../ProfileStack';
import { AppStackParams } from '../../../../appNavigators/AppStack';


export const ProfileScreen = () => {
  const navigation = useNavigation<NavigationProp<ProfileStackParams | AppStackParams>>();
  const appColors = colors();
  const screenWidth = Dimensions.get('window').width;

  const [refreshing, setRefreshing] = useState(false);

  const badgeNamesTemp = [
    'https://cdn-icons-png.flaticon.com/512/7339/7339233.png',
    'https://cdn3.iconfinder.com/data/icons/survey-feedback-caramel-vol-2/512/TOP_RATED-512.png',
    'https://cdn.icon-icons.com/icons2/2744/PNG/512/medal_award_success_badge_achievement_icon_175957.png',
    'https://static-00.iconduck.com/assets.00/achievement-badge-icon-2048x1328-gzuv2dzs.png',
    'https://static-00.iconduck.com/assets.00/achievement-badge-icon-1481x2048-g5dnah98.png',
    'https://cdn-icons-png.flaticon.com/512/771/771222.png',
    'https://img.uxwing.com/wp-content/themes/uxwing/download/sport-awards/achievement-award-medal-icon.png',
    'https://cdn.icon-icons.com/icons2/3570/PNG/512/success_reward_achievement_badge_medal_prize_trophy_icon_225522.png'
  ]

  return (
    <SafeAreaView style={[styles.container, {backgroundColor: appColors.background}]}>
      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              // handle refresh
            }}
          />
        }
        showsVerticalScrollIndicator={false}
        style={{width: '100%'}}
      >
        <View style={{alignItems: 'center'}}>
          <Image
            resizeMode='contain'
            source={user1.profilePicture}
            style={{borderRadius: 100, margin: 10, height: screenWidth/2, width: screenWidth/2}}
          />
          <CustomText centered>Joined April 7, 2023</CustomText>
        </View>
        <Section title="Your Achievements" titleFontSize={18} >
          <ScrollView showsHorizontalScrollIndicator={false} horizontal style={{paddingLeft: 10, paddingRight: 10, marginTop: 10, marginBottom: 10}}>
            {badgeNamesTemp.map((item, index) => (
              <TouchableOpacity key={index} style={{height: 50, width: 50, alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: appColors.primary, borderRadius: 99, marginRight: 10, padding: 5}}>
                {/* <CustomText>{item}</CustomText> */}
                <Image
                  source={{uri: item}}
                  resizeMode='contain'
                  style={{borderRadius: 100, margin: 10, height: '100%', width: '100%'}}
                />
              </TouchableOpacity>
            ))}
              <TouchableOpacity style={{height: 50, width: 100, alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: appColors.primary, padding: 10, borderRadius: 5, marginRight: 5}}>
                <CustomText>View All</CustomText>
              </TouchableOpacity>
          </ScrollView>
        </Section>
        <View style={{marginTop: 10}}>
          <ListItem
              title="Set Your Goals"
              icon={generalIcons.plus}
              description='Create a new training or nutrition plan'
              onPress={() => (navigation as NavigationProp<AppStackParams>).navigate('CustomTrainingProgramStack')}
              topDivider={true}
          />
          <ListItem
              title="History"
              icon={generalIcons.clock}
              description='View your previous workout programs'
              onPress={() => (navigation as NavigationProp<ProfileStackParams>).navigate('PlaceholderScreen', { title: 'History' })}
              topDivider={false}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center'
  },
  topBarContainer: {
    width: '100%',
    padding: 15,
    flexDirection: 'row',
    justifyContent: 'space-between'
  }
});