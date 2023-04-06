import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, useColorScheme } from 'react-native';
import { colors } from '../../colors';

interface ListItem {
  name: string;
  description: string;
}

interface ListCardProps {
  title: string;
  items: ListItem[];
}

export const ListCard = ({ title, items }: ListCardProps) => {
    const appColors = colors();
    const listItems = [{ name: '', description: '' }, { name: '', description: '' }, { name: '', description: '' }];

    items.slice(0,3).map((item, index) => {
        listItems[index] = item;
    })

    const renderListItems = () => {
        return (
        <>
            {listItems.map((item, index) => (
            <View key={index} style={styles.listItem}>
                <Text style={[styles.itemName, {color: appColors.text}]}>{item.name}</Text>
                <Text style={[styles.itemDescription, {color: appColors.subtext}]}>{item.description}</Text>
            </View>
            ))}
        </>
        );
    };

    return (
        <TouchableOpacity 
          style={[
            styles.card, 
            {
              backgroundColor: appColors.onBackground,
              shadowColor: '#000000',
              shadowOpacity: useColorScheme() === 'light' ? 0.1 : 0,
              shadowOffset: {width: 1, height: 1}
            }
          ]}
        >
            <View style={styles.titleContainer}>
                <Text style={[styles.title, {color: appColors.text}]}>{title}</Text>
            </View>
            <View style={styles.listContainer}>{renderListItems()}</View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    borderRadius: 15,
    padding: 10,
    margin: 10,
  },
  titleContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRightWidth: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  listContainer: {
    flex: 2,
    flexDirection: 'column',
  },
  listItem: {
    flex: 1,
    padding: 5
  },
  itemName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  itemDescription: {
    fontSize: 14,
    marginTop: 5,
  }
});