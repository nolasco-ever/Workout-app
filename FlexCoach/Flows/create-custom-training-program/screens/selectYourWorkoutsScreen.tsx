import { SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View, useColorScheme } from 'react-native'
import React, { useEffect, useState } from 'react'
import { Section } from '../../../components/sections/Section'
import { generalIcons } from '../../../components/icons/icon-library'
import { ListItem } from '../../../components/list-items/ListItem'
import { colors } from '../../../colors'
import { CustomText } from '../../../components/text/customText'
import { AlertBanner } from '../../../components/banners/alertBanner'
import { backSection, bicepsSection, chestSection, legsSection, shouldersSection, tricepsSection } from '../../../config/customize-training-program-flow/selectYourWorkouts'
import { Button } from '../../../components/buttons/button'
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome'
import { IconProp } from '@fortawesome/fontawesome-svg-core'
import { SelectionItem } from '../../../components/list-items/selectionItem'
import { NavigationProp, useNavigation } from '@react-navigation/native'
import { CustomTrainingProgramStackParams } from '../CustomTrainingProgramStack'

export const SelectYourWorkoutsScreen = () => {
  const navigation = useNavigation<NavigationProp<CustomTrainingProgramStackParams, "TutorialScreen" | "ScheduleTrainingProgramScreen">>();
  const appColors = colors();
  const [selectedWorkouts, setSelectedWorkouts] = useState<string[]>([]);


  const toggleWorkoutSelection = (title: any) => {
    if (selectedWorkouts.includes(title)) {
      setSelectedWorkouts(selectedWorkouts.filter((item) => item !== title));
    } else {
      if (selectedWorkouts.length < 20) {
        setSelectedWorkouts([...selectedWorkouts, title]);
      }
    }
  };

  const renderWorkoutGroup = (groupName: string, workouts: { name: string; link: string; howToSteps: string[]; }[]) => {
    return (
      <View>
        <Section title={groupName}>
          <View style={{flexDirection: 'row', padding: 10, flexWrap: 'wrap'}}>
            {workouts.map((workout: { name: string; link: string; howToSteps: string[] }, index) => (
              <SelectionItem
                key={index}
                selectedItems={selectedWorkouts}
                title={workout.name}
                onPressItem={() => toggleWorkoutSelection(workout.name)}
                onPressInfo={() => navigation.navigate('TutorialScreen', {title: workout.name, videoLink: workout.link, steps: workout.howToSteps, muscleGroupWorkouts: workouts})}
              />
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
      <TouchableOpacity onPress={() => setSelectedWorkouts([])} style={{flexDirection: 'row', margin: 10, justifyContent: 'flex-end'}}>
          <Text style={{color: appColors.text, fontWeight: 'bold', fontSize: 16}}>Clear</Text>
      </TouchableOpacity>
      <AlertBanner
        message='Make sure to include exercises that target all major muscle groups'
        isClosable
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
          label='Next'
          onPress={() => navigation.navigate('ScheduleTrainingProgramScreen', {items: selectedWorkouts})}
          isActive={selectedWorkouts.length >= 6}
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
    flexDirection: 'row',
    alignItems: 'center'
  },
  workoutTitle: {
    fontSize: 16,
    marginRight:  5
  },
});