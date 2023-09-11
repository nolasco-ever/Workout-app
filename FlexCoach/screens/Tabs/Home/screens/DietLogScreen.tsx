import { StyleSheet, View } from 'react-native'
import React, { useState } from 'react'
import { colors } from '../../../../colors'
import { ScrollView } from 'react-native-gesture-handler'
import { CustomTable } from '../../../../components/tables/customTable'
import { mockDietTrackerData } from '../../../../mocks/tableDataMocks'
import { Button } from '../../../../components/buttons/button'
import { NavigationProp, useNavigation } from '@react-navigation/native'
import { HomeStackParams } from '../HomeStack'

export const DietLogScreen = () => {
  const navigation = useNavigation<NavigationProp<HomeStackParams>>();

    const appColors = colors();

    const [tableData, setTableData] = useState(mockDietTrackerData.tableData)

    return (
      <View style={[styles.container, {backgroundColor: appColors.background}]}>
          <ScrollView style={{width: '100%'}}>
              <CustomTable
                title={mockDietTrackerData.title}
                data={tableData}
                columnHeaders={mockDietTrackerData.columnHeaders}
              />
          </ScrollView>
          <Button
            label='Add'
            onPress={() => {
              // setTableData(prev => [...prev, ['Item Name', 90, 20]])
              navigation.navigate('AddDietEntryScreen')
            }}
          />
      </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
    },
});