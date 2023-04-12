import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, SafeAreaView } from 'react-native';
import { colors } from '../../../colors';
import { CustomText } from '../../../components/text/customText';
import { AlertBanner } from '../../../components/banners/alertBanner';
import { WeekHeader } from '../../../components/calendars/weekHeader';
import { SelectionItem } from '../../../components/list-items/selectionItem';

type Props = {
  items: string[];
};

type Day = 'Sun' | 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat';

export const ScheduleTrainingProgramScreen = ({ route }: {route: any}) => {
    const {items} = route.params;
    const appColors = colors();

    const [selectedDay, setSelectedDay] = useState<number>(0);
    const daysOfWeek: Day[] = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    const [organizedItems, setOrganizedItems] = useState<string[][]>([
        [],
        [],
        [],
        [],
        [],
        [],
        [],
    ]);

    const handleOrganizeItem = (item: string, index: number) => {
        const updatedItems = [...organizedItems]; // make a copy of the state array
        const selectedDayItems = updatedItems[index]; // get the array for the selected day
        if (selectedDayItems.includes(item)) {
          updatedItems[index] = selectedDayItems.filter((item) => item !== item);
        } else {
          if (selectedDayItems.length < 20) {
            updatedItems[index] = [...selectedDayItems, item];
          }
        }
        setOrganizedItems(updatedItems); // update the state with the modified array
    };

    return (
        <SafeAreaView style={[styles.container, {backgroundColor: appColors.background}]}>
            <View style={{margin: 10, flexDirection: 'row'}}>
                <CustomText type='subheader'>Establish a consistent routine by scheduling your workouts throughout the week</CustomText>
            </View>
            <AlertBanner
                message='Remember to plan rest days to allow for recovery and prevent burnout!'
                isClosable
            />
            <View style={styles.weekContainer}>
                {daysOfWeek.map((day, index) => (
                    <TouchableOpacity
                        key={index}
                        onPress={() => setSelectedDay(index)}
                        style={[
                            styles.bottomButton,
                            {
                                backgroundColor: selectedDay === index ? appColors.primary : appColors.transparent
                            }
                        ]}
                    >
                        <Text style={{color: appColors.text}}>{day}</Text>
                    </TouchableOpacity>
                ))}
            </View>
            <View style={{flexDirection: 'row', padding: 10, flexWrap: 'wrap'}}>
                {items.map((item: string) => (
                    <SelectionItem
                        key={item}
                        title={item}
                        selectedItems={organizedItems[selectedDay]}
                        onPressItem={() => handleOrganizeItem(item, selectedDay)}
                    />
                ))}
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  itemsContainer: {
    
  },
  daysContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dayContainer: {
    flex: 1,
    alignItems: 'center',
  },
  organizedItem: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#000',
    borderRadius: 8,
    marginTop: 8,
  },
  weekContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    margin: 10,
  },
  bottomButton: {
    borderRadius: 5,
    padding: 10
  },
});