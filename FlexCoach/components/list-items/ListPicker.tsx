import { IconProp } from '@fortawesome/fontawesome-svg-core';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, Image, Dimensions } from 'react-native';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { useNavigation } from '@react-navigation/native';
import { colors } from '../../colors';
import { ListItemChoice } from './ListItemChoice';

interface ListPickerProps {
    listItems: {
        icon?: string;
        title: string;
        description?: string;
    }[];
    selectedItem: number;
    setSelectedItem: (value: React.SetStateAction<number>) => void;
}

export const ListPicker = ({listItems, selectedItem, setSelectedItem}: ListPickerProps) => {
  const appColors = colors();
  const screenWidth = Dimensions.get('window').width;
  return (
    <View>
        {listItems.map((item, index) => (
            <ListItemChoice
                key={index}
                title={item.title}
                selected={selectedItem === index}
                onPress={() => setSelectedItem(index)}
            />
        ))}
    </View>
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