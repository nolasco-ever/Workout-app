import { SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import React, { useEffect, useState } from 'react'
import { Section } from '../../../components/sections/Section'
import { generalIcons } from '../../../components/icons/icon-library'
import { ListItem } from '../../../components/list-items/ListItem'
import { colors } from '../../../colors'
import { CustomText } from '../../../components/text/customText'
import { AlertBanner } from '../../../components/banners/alertBanner'
import { backSection, bicepsSection, chestSection, legsSection, shouldersSection, tricepsSection } from '../../../config/customize-training-program-flow/selectYourWorkouts'
import { Button } from '../../../components/buttons/button'

export const SelectYourWorkoutsScreen = () => {
  const appColors = colors();
  const [selectedWorkouts, setSelectedWorkouts] = useState<string[]>([]);
  const [isDisabled, setIsDisabled] = useState<boolean>(true);

  const toggleWorkoutSelection = (workout: any) => {
    if (selectedWorkouts.includes(workout)) {
      setSelectedWorkouts(selectedWorkouts.filter((item) => item !== workout));
    } else {
      if (selectedWorkouts.length < 20) {
        setSelectedWorkouts([...selectedWorkouts, workout]);
      }
    }
  };

  useEffect(() => {
    if (selectedWorkouts.length < 6) {
      setIsDisabled(true);
    } else {
      setIsDisabled(false);
    }
  }, [selectedWorkouts])

  const renderWorkoutGroup = (groupName: string, workouts: string[]) => {
    return (
      <View>
        <Section title={groupName}>
          <View style={{flexDirection: 'row', padding: 10, flexWrap: 'wrap'}}>
            {workouts.map((workout: string, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.workoutItem,
                  {
                    backgroundColor: selectedWorkouts.includes(workout) ? appColors.secondary : appColors.onBackground,
                  }
                ]}
                onPress={() => toggleWorkoutSelection(workout)}>
                <Text style={[styles.workoutTitle, {color: appColors.text}]}>{workout}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </Section>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, {backgroundColor: appColors.background}]}>
      <View style={{margin: 10, flexDirection: 'row'}}>
        <CustomText type='subheader'>Create a balanced program by selecting 6-20 workouts {`(${selectedWorkouts.length}/20)`}</CustomText>
      </View>
      <AlertBanner
        message='Make sure to include exercises that target all major muscle groups'
      />
      <ScrollView>
        {renderWorkoutGroup(chestSection.name, chestSection.exercises)}
        {renderWorkoutGroup(tricepsSection.name, tricepsSection.exercises)}
        {renderWorkoutGroup(bicepsSection.name, bicepsSection.exercises)}
        {renderWorkoutGroup(backSection.name, backSection.exercises)}
        {renderWorkoutGroup(shouldersSection.name, shouldersSection.exercises)}
        {renderWorkoutGroup(legsSection.name, legsSection.exercises)}
      </ScrollView>
      <Button
          title='Next'
          onPress={() => console.log('Pressed')}
          isPrimary
          disabled={isDisabled}
        />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  workoutItem: {
    padding: 10,
    borderRadius: 5,
    margin: 5,
  },
  workoutTitle: {
    fontSize: 16,
  },
});