import { IconProp } from '@fortawesome/fontawesome-svg-core';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, Image, Dimensions, ScrollView } from 'react-native';
import { colors } from '../../../../colors';
import { generalIcons, tabIcons } from '../../../../components/icons/icon-library';
import { CustomText } from '../../../../components/text/customText';
import { user1 } from '../../../../mocks/userMocks';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { useNavigation } from '@react-navigation/native';
import { ListItemChoice } from '../../../../components/list-items/ListItemChoice';
import { ListPicker } from '../../../../components/list-items/ListPicker';
import { Button } from '../../../../components/buttons/button';


export const AppThemeScreen = ({navigation}: {navigation: any}) => {
  const appColors = colors();
  const screenWidth = Dimensions.get('window').width;

  const listItems = [
    {
      title: 'Light',
      selected: false
    },
    {
      title: 'Dark',
      selected: false
    },
    {
        title: 'System',
        selected: true
    },
    // Add as many items as needed
  ];

  const setTheme = (theme: string) => {
    console.log(`Set app theme to: ${theme}`);
  }

  const [selecteditem, setSelectedItem] = useState<number>(0);

  const setAppTheme = () => {
    setTheme(listItems[selecteditem].title);
    navigation.goBack();
  }

  return (
    <SafeAreaView style={[styles.container, {backgroundColor: appColors.background}]}>
            <View style={{flex: 1, width: '100%'}}>
                <ListPicker
                    listItems={listItems}
                    selectedItem={selecteditem}
                    setSelectedItem={setSelectedItem}
                />
            </View>
            <View style={{flex: 1, flexDirection: 'column', justifyContent: 'flex-end', alignItems: 'center'}}>
                <Button
                    title='Set Theme'
                    onPress={() => setAppTheme()}
                    isPrimary
                />
            </View>
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