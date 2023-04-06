import { IconProp } from '@fortawesome/fontawesome-svg-core';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import React from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import { colors } from '../../../../colors';
import { generalIcons, tabIcons } from '../../../../components/icons/icon-library';
import { CustomText } from '../../../../components/text/customText';
import { ListItem } from '../../../../components/list-items/ListItem';
import { ScrollView } from 'react-native-gesture-handler';
import { settingsListMocks } from '../../../../mocks/settingsListMocks';


export const SettingsScreen = ({navigation}:{navigation: any}) => {
  
  const appColors = colors();
  return (
    <SafeAreaView style={[styles.container, {backgroundColor: appColors.background}]}>
      <ScrollView style={{width: '100%'}}>        
        {settingsListMocks.map((item) => (
          <ListItem
            key={item.id}
            icon={item.icon}
            title={item.title}
            description={item.description}
            onPress={() => navigation.navigate(item.navigateTo, {title: item.title, icon: item.icon})}
          />
        ))}
        <ListItem
          icon={generalIcons.signOut}
          title="Sign Out"
          topDivider
          onPress={() => navigation.replace('SignIn')}
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