import { Dimensions, ScrollView, StyleSheet, Text, View, useColorScheme } from 'react-native'
import React from 'react'
import { CustomText } from '../text/customText'
import { colors } from '../../colors';

interface CustomTableProps {
  title?: string;
  data: any[][];
  columnHeaders: string[];
}

export const CustomTable = ({ title, data, columnHeaders }: CustomTableProps) => {
  const appColors = colors();
  const screenWidth = Dimensions.get('window').width;
  const tableContent = data.map((row, index) => {
    const tableRow = row.map((cell, index) => {
      return <View style={[styles.cell, {width: '33%'}]} key={index}><Text style={{color: appColors.text}}>{cell}</Text></View>
    });

    return <View style={styles.row} key={index}>{tableRow}</View>
  });

  const headerRow = columnHeaders.map((header, index) => {
    return <View style={[styles.headerCell, {width: screenWidth/3}]} key={index}><Text style={{color: appColors.text, fontWeight: 'bold'}}>{header}</Text></View>
  });

  return (
    <View 
      style={[
        styles.container, 
        {
          backgroundColor: appColors.onBackground,
          shadowColor: '#000000',
          shadowOpacity: useColorScheme() === 'light' ? 0.1 : 0,
          shadowOffset: {width: 1, height: 1}
        }
      ]}
    >
      {title && <CustomText type='subheader' centered>{title}</CustomText>}
      <ScrollView horizontal={true} showsHorizontalScrollIndicator={false} contentContainerStyle={{flexDirection: 'column', width: '100%'}}>
        <View style={styles.headerRow}>{headerRow}</View>
        {tableContent}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingTop: 10,
    flexDirection: 'column',
    borderRadius: 10,
    margin: 10
  },
  headerRow: {
    flexDirection: 'row',
  },
  row: {
    flexDirection: 'row',
  },
  cell: {
    padding: 10,
  },
  headerCell: {
    padding: 10
  },
});