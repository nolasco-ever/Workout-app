import { Icon } from '../../../../components/icons/Icon';
import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, Dimensions, ScrollView, RefreshControl } from 'react-native';
import { colors } from '../../../../colors';
import { generalIcons, tabIcons } from '../../../../components/icons/icon-library';
import { CustomText } from '../../../../components/text/customText';
import { user1 } from '../../../../mocks/userMocks';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { NavigationProp, StackActions, useNavigation } from '@react-navigation/native';
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
    <SafeAreaView edges={['left', 'right']} style={[styles.container, {backgroundColor: appColors.background}]}>
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
              title="My plans"
              icon={generalIcons.dumbbell}
              description='Create, edit, and switch workout plans'
              onPress={() => (navigation as NavigationProp<AppStackParams>).navigate('PlansStack')}
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
        <View style={{marginTop: 10}}>
          <ListItem
              icon={generalIcons.moon}
              title='App Theme'
              description='Switch between a light theme or a dark theme'
              onPress={() => (navigation as NavigationProp<ProfileStackParams>).navigate('AppThemeScreen')}
              topDivider={true}
          />
          <ListItem
              icon={generalIcons.bell}
              title='Notification Preferences'
              description={`Choose what notifications you'd like to receive`}
              onPress={() => (navigation as NavigationProp<ProfileStackParams>).navigate('PlaceholderScreen', { title: 'Notification Preferences' })}
          />
          <ListItem
              icon={generalIcons.key}
              title="Privacy and Permissions"
              description="Access our Terms of Use and Privacy Policy"
              onPress={() => (navigation as NavigationProp<ProfileStackParams>).navigate('PlaceholderScreen', { title: 'Privacy and Permissions' })}
          />
          <ListItem
              icon={generalIcons.user}
              title="Account"
              description="Update, set, or remove information from your account"
              onPress={() => (navigation as NavigationProp<ProfileStackParams>).navigate('PlaceholderScreen', { title: 'Account' })}
          />
          <ListItem
              icon={generalIcons.envelope}
              title="Contact Us"
              description="Reach out with any questions, comments, or concerns"
              onPress={() => (navigation as NavigationProp<ProfileStackParams>).navigate('PlaceholderScreen', { title: 'Contact Us' })}
          />
          <ListItem
              icon={generalIcons.signOut}
              title="Sign Out"
              topDivider={true}
              onPress={() => navigation.dispatch(StackActions.replace('SignInStack'))}
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