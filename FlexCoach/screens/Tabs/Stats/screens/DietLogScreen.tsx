import { FlatList, StyleSheet, Text, View } from 'react-native'
import React from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { colors } from '../../../../colors'
import { CustomText } from '../../../../components/text/customText'
import { ScrollView } from 'react-native-gesture-handler'
import { CustomTable } from '../../../../components/tables/customTable'
import { mockDietTrackerData } from '../../../../mocks/tableDataMocks'

export const DietLogScreen = () => {
    const appColors = colors();

    return (
      <View style={[styles.container, {backgroundColor: appColors.background}]}>
          <ScrollView style={{width: '100%'}}>
              <CustomTable
                title={mockDietTrackerData.title}
                data={mockDietTrackerData.tableData}
                columnHeaders={mockDietTrackerData.columnHeaders}
              />
          </ScrollView>
      </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
    },
    table: {
        flex: 1,
      },
      row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#ccc',
      },
      name: {
        flex: 2,
      },
      calories: {
        flex: 1,
        textAlign: 'right',
      },
      protein: {
        flex: 1,
        textAlign: 'right',
      },
      header: {
        fontWeight: 'bold',
      },
});