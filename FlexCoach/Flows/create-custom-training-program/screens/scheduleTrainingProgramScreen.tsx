import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, SafeAreaView } from 'react-native';
import { colors } from '../../../colors';
import { CustomText } from '../../../components/text/customText';
import { AlertBanner } from '../../../components/banners/alertBanner';
import { WeekHeader } from '../../../components/calendars/weekHeader';
import { SelectionItem } from '../../../components/list-items/selectionItem';
import { ScrollView } from 'react-native-gesture-handler';
import { Button } from '../../../components/buttons/Button';
import { CheckBox } from '../../../components/buttons/checkBox';
import { NumberPicker } from '../../../components/Pickers/numberPicker';

type Props = {
  items: string[];
};

type Day = 'Sun' | 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat';

export const ScheduleTrainingProgramScreen = ({ navigation, route }: {navigation: any, route: any}) => {
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

    const [numOfWeeks, setNumOfWeeks] = useState(4);

    const handleValueChange = (newValue: number) => {
        setNumOfWeeks(newValue);
      };

    const handleOrganizeItem = (item: string, index: number) => {
        const updatedItems = [...organizedItems]; // make a copy of the state array
        const selectedDayItems = updatedItems[index]; // get the array for the selected day
        if (selectedDayItems.includes(item)) {
          updatedItems[index] = selectedDayItems.filter((itemName) => itemName !== item);
        } else {
          if (selectedDayItems.length < 20) {
            updatedItems[index] = [...selectedDayItems, item];
          }
        }
        setOrganizedItems(updatedItems); // update the state with the modified array
    };

    const handleRestDayToggle = () => {
        const updatedItems = [...organizedItems]; // make a copy of the state array

        if (checkIfRestDay()) {
            updatedItems[selectedDay] = [];
        } else {
            updatedItems[selectedDay] = ['Rest Day'];
        }

        setOrganizedItems(updatedItems); // update the state with the modified array
    }

    const checkIfRestDay = () => {
        return (organizedItems[selectedDay].length === 1 && organizedItems[selectedDay].includes('Rest Day'))
        ? true : false
    }

    const handleClear = () => {
        const updatedItems = [...organizedItems]; // make a copy of the state array
        updatedItems[selectedDay] = [];
        setOrganizedItems(updatedItems); // update the state with the modified array
    }

    const renderItems = () => {
        return (
            <>
                <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}}>
                    <CheckBox
                        label='Rest Day'
                        checked={checkIfRestDay()}
                        onPress={() => handleRestDayToggle()}
                    />
                    {!checkIfRestDay() && (
                        <TouchableOpacity onPress={() => handleClear()} style={{margin: 10}}>
                            <Text style={{color: appColors.text, fontWeight: 'bold', fontSize: 16}}>Clear</Text>
                        </TouchableOpacity>
                    )}
                </View>
                <ScrollView style={{flex: 1}} contentContainerStyle={{padding: 10, paddingTop: 0}}>
                    {!checkIfRestDay() && (
                        <View style={{flexWrap: 'wrap', flexDirection: 'row', justifyContent: 'center' }}>
                            {items.map((item: string) => (
                                <SelectionItem
                                    key={item}
                                    title={item}
                                    selectedItems={organizedItems[selectedDay]}
                                    onPressItem={() => handleOrganizeItem(item, selectedDay)}
                                />
                            ))}
                        </View>
                    )}
                </ScrollView>
            </>
        )
    }

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
                        <Text style={{color: selectedDay === index ? appColors.onPrimaryText : appColors.text}}>{day}</Text>
                    </TouchableOpacity>
                ))}
            </View>
            {renderItems()}
            <NumberPicker
                label='Number of Weeks'
                min={4}
                max={12}
                onValueChange={handleValueChange}
            />
            <Button
                label='Next'
                onPress={() => navigation.navigate('reviewYourProgram', {workoutItems: organizedItems, numOfWeeks: numOfWeeks})}
                isActive={organizedItems.every(arr => arr.length > 0)}
            />
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