import { SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import React, { useState } from 'react'
import { colors } from '../../../colors';
import { CustomText } from '../../../components/text/customText';
import { Button } from '../../../components/buttons/button';
import { AnimatedImage } from '../../../components/utils/AnimatedImage';
import { setFitnessGoalsOptions } from '../../../config/customize-training-program-flow/setFitnessGoals';
import { defaultAnimation } from '../../../animations/custom-training-program-flow';

export const SetFitnessGoalScreen = ({navigation}: {navigation: any}) => {
  const appColors = colors();
  const [selectedGoal, setSelectedGoal] = useState<number | null>(null);

  const handleGoalPress = (index: number) => {
    setSelectedGoal(index);
  };

  const renderGoal = (goal: string, index: number) => {
    const isSelected = selectedGoal === index;

    return (
      <TouchableOpacity
        key={goal}
        onPress={() => handleGoalPress(index)}
        style={[
          styles.goalContainer,
          {
            backgroundColor: isSelected ? appColors.secondary : appColors.transparent
          }
        ]}
      >
        <Text 
          style={[
            styles.goalText,
            {
              color: isSelected ? appColors.onPrimaryText : appColors.text
            }
          ]}
        >
          {goal}
        </Text>
      </TouchableOpacity>
    );
  };

  const getImage = () => {
    if (selectedGoal === null) {
      return defaultAnimation
    } else {
      return setFitnessGoalsOptions[selectedGoal].image
    }
  }

  return (
    <SafeAreaView style={[styles.container, {backgroundColor: appColors.background}]}>
      <AnimatedImage source={getImage()} size={250}/>
      <View style={{flex: 1, alignItems: 'center', margin: 10}}>
        <CustomText type='header'>Select a goal</CustomText>
        <View style={styles.goalsContainer}>
          {setFitnessGoalsOptions.map((goal, index) => renderGoal(goal.name, index))}
        </View>
      </View>
      <Button
          title='Next'
          onPress={() => navigation.navigate('selectYourWorkoutsScreen')}
          isPrimary
          disabled={selectedGoal === null}
        />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  goalsContainer: {
    flexDirection: 'column',
    margin: 10,
  },
  goalContainer: {
    borderRadius: 5,
    padding: 10,
    margin: 5,
    justifyContent: 'center',
    alignItems: 'center'
  },
  goalText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  button: {
    backgroundColor: '#000',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});