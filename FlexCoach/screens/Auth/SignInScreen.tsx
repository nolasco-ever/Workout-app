import React from 'react';
import { ParamListBase } from '@react-navigation/native';
import { StyleSheet, TouchableOpacity, SafeAreaView, Dimensions, Text } from 'react-native';
import { colors } from '../../colors';
import { CustomText } from '../../components/text/customText';
import { StackNavigationProp } from '@react-navigation/stack';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { directionIcons } from '../../components/icons/icon-library';
import { IconProp } from '@fortawesome/fontawesome-svg-core';

type SignInScreenProps = {
    navigation: StackNavigationProp<ParamListBase>;
  };
  
export const SignInScreen = ({ navigation }: SignInScreenProps) => {
  const appColors = colors();
  const screenWidth = Dimensions.get('window').width;
  return (
    <SafeAreaView style={[styles.container, {backgroundColor: appColors.background}]}>
        <TouchableOpacity style={[styles.button, {width: screenWidth/2, backgroundColor: appColors.primary}]} onPress={() => navigation.replace('Tabs')}>
          <Text style={{fontWeight: 'bold', fontSize: 24, color: appColors.onPrimaryText}}>Go To App</Text>
          <FontAwesomeIcon icon={directionIcons.rightArrow as IconProp} size={25} color={appColors.onPrimaryText}/>
        </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  button: {
    flexDirection:'row',
    justifyContent: 'space-around',
    borderRadius: 50,
    padding: 10,
    alignItems: 'center'
  }
});