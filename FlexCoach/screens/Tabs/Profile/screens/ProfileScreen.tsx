import { IconProp } from '@fortawesome/fontawesome-svg-core';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, Image, Dimensions, ScrollView, RefreshControl } from 'react-native';
import { colors } from '../../../../colors';
import { generalIcons, tabIcons } from '../../../../components/icons/icon-library';
import { CustomText } from '../../../../components/text/customText';
import { user1 } from '../../../../mocks/userMocks';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { useNavigation } from '@react-navigation/native';
import { profileListMocks } from '../../../../mocks/listItemMocks';
import { ListItem } from '../../../../components/list-items/ListItem';
import { Section } from '../../../../components/sections/Section';


export const ProfileScreen = ({navigation}: {navigation: any}) => {
  const appColors = colors();
  const screenWidth = Dimensions.get('window').width;

  const [refreshing, setRefreshing] = useState(false);

  const badgeNamesTemp = [
    'Badge1',
    'Badge2',
    'Badge3',
    'Badge4',
    'Badge5',
    'Badge6',
    'Badge7',
  ]

  return (
    <SafeAreaView style={[styles.container, {backgroundColor: appColors.background}]}>
      <View style={styles.topBarContainer}>
        <CustomText type='subheader'>{user1.firstName} {user1.lastName}</CustomText>
        <TouchableOpacity onPress={() => navigation.navigate('settingsScreen')}>
          <FontAwesomeIcon icon={generalIcons.gear as IconProp} color={appColors.icon} size={30}/>
        </TouchableOpacity>
      </View>
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
          <ScrollView horizontal style={{paddingLeft: 10, paddingRight: 10}}>
            {badgeNamesTemp.map((item, index) => (
              <TouchableOpacity key={index} style={{height: 50, width: 100, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: appColors.primary, padding: 10, borderRadius: 5, marginRight: 5}}>
                <CustomText>{item}</CustomText>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </Section>
        <View style={{marginTop: 10}}>
          {profileListMocks.map((item, index) => (
            <ListItem
              key={item.id}
              title={item.title}
              icon={item.icon}
              description={item.description}
              onPress={() => navigation.navigate(item.navigateTo, {title: item.title, icon: item.icon})}
              // topDivider={index === 0 ? true : false}
            />
          ))}
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