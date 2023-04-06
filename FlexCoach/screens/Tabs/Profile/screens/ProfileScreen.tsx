import { IconProp } from '@fortawesome/fontawesome-svg-core';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, Image, Dimensions, ScrollView } from 'react-native';
import { colors } from '../../../../colors';
import { generalIcons, tabIcons } from '../../../../components/icons/icon-library';
import { CustomText } from '../../../../components/text/customText';
import { user1 } from '../../../../mocks/userMocks';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { useNavigation } from '@react-navigation/native';


export const ProfileScreen = ({navigation}: {navigation: any}) => {
  const appColors = colors();
  const screenWidth = Dimensions.get('window').width;
  return (
    <SafeAreaView style={[styles.container, {backgroundColor: appColors.background}]}>
      <ScrollView style={{width: '100%'}} contentContainerStyle={{alignItems: 'center'}}>
        <View style={styles.topBarContainer}>
          <CustomText type='subheader'>{user1.firstName} {user1.lastName}</CustomText>
          <TouchableOpacity onPress={() => navigation.navigate('settingsScreen')}>
            <FontAwesomeIcon icon={generalIcons.gear as IconProp} color={appColors.icon} size={30}/>
          </TouchableOpacity>
        </View>
        <Image
          resizeMode='contain'
          source={{
              width: screenWidth/2,
              height: screenWidth/2,
              uri: user1.profilePicture
          }}
          style={{borderRadius: 100}}
        />
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