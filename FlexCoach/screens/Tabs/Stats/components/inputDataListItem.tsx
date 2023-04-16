import { Dimensions, StyleSheet, Text, TextInput, View, useColorScheme } from 'react-native'
import React from 'react'
import { colors } from '../../../../colors';
import { CustomText } from '../../../../components/text/customText';

export const InputDataListItem = () => {
  const appColors = colors();
  const screenWidth = Dimensions.get('window').width;

  return (
    <View style={styles.container}>
        <TextInput
          style={[styles.input, {backgroundColor: useColorScheme() === 'dark' ? appColors.onBackground : appColors.lightGrey}]}
        />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    marginBottom: 10
  },
  input: {
    flex: 1,
    borderRadius: 10,
    padding: 12,
    marginHorizontal: 8,
  },
})