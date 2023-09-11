import React from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import { colors } from '../../../../colors';
import { generalIcons, tabIcons } from '../../../../components/icons/icon-library';
import { ListItem } from '../../../../components/list-items/ListItem';
import { ScrollView } from 'react-native-gesture-handler';
import { useNavigation, NavigationProp, StackActions } from '@react-navigation/native';
import { ProfileStackParams } from '../ProfileStack';


export const SettingsScreen = () => {
  const navigation = useNavigation<NavigationProp<ProfileStackParams>>();
  
  const appColors = colors();
  return (
    <SafeAreaView style={[styles.container, {backgroundColor: appColors.background}]}>
      <ScrollView style={{width: '100%'}}>       
        <ListItem
          icon={generalIcons.moon}
          title='App Theme'
          description='Switch between a light theme or a dark theme'
          onPress={() => navigation.navigate('AppThemeScreen')}
        /> 
        <ListItem
          icon={generalIcons.bell}
          title='Notification Preferences'
          description={`Choose what notifications you'd like to receive`}
          onPress={() => navigation.navigate('PlaceholderScreen', { title: 'Notification Preferences' })}
        /> 
        <ListItem
          icon={generalIcons.key}
          title="Privacy and Permissions"
          description="Access our Terms of Use and Privacy Policy"
          onPress={() => navigation.navigate('PlaceholderScreen', { title: 'Privacy and Permissions' })}
        />
        <ListItem
          icon={generalIcons.user}
          title="Account"
          description="Update, set, or remove information from your account"
          onPress={() => navigation.navigate('PlaceholderScreen', { title: 'Account' })}
        />
        <ListItem
          icon={generalIcons.envelope}
          title="Contact Us"
          description="Reach out with any questions, comments, or concerns"
          onPress={() => navigation.navigate('PlaceholderScreen', { title: 'Contact Us' })}
        />

        <ListItem
          icon={generalIcons.signOut}
          title="Sign Out"
          topDivider
          onPress={() => navigation.dispatch(StackActions.replace('SignInStack'))}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
  }
});