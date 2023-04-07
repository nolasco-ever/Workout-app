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


export const ProfileScreen = ({navigation}: {navigation: any}) => {
  const appColors = colors();
  const screenWidth = Dimensions.get('window').width;

  const [refreshing, setRefreshing] = useState(false);

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
        contentContainerStyle={{alignItems: 'center'}}
      >
        <View>
          <Image
            resizeMode='contain'
            source={{
                width: screenWidth/2,
                height: screenWidth/2,
                uri: user1.profilePicture
            }}
            style={{borderRadius: 100, margin: 10}}
          />
          <CustomText centered>Joined April 7, 2023</CustomText>
        </View>
        <View style={{marginTop: 10}}>
          {profileListMocks.map((item, index) => (
            <ListItem
              key={item.id}
              title={item.title}
              icon={item.icon}
              description={item.description}
              onPress={() => navigation.navigate(item.navigateTo, {title: item.title, icon: item.icon})}
              topDivider={index === 0 ? true : false}
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