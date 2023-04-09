import { Dimensions, Image, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import React, { useState } from 'react'
import { colors } from '../../../colors';
import { CustomText } from '../../../components/text/customText';
import { Button } from '../../../components/buttons/button';
import { AnimatedImage } from '../../../components/utils/AnimatedImage';
import { setFitnessGoalsOptions } from '../../../config/customize-training-program-flow/setFitnessGoals';
import { defaultAnimation } from '../../../animations/custom-training-program-flow';

export const SetFitnessGoalScreen = () => {
  const appColors = colors();
  const [selectedGoal, setSelectedGoal] = useState<number | null>(null);

  const goalImages = [
    'https://cdn.vox-cdn.com/thumbor/XSW5TTZRjsqJgUeBu46g2zmn4uE=/0x0:5472x3648/1200x800/filters:focal(1554x1539:2428x2413)/cdn.vox-cdn.com/uploads/chorus_image/image/67453937/1224663515.jpg.0.jpg',
    'https://www.nuvovivo.com/wp-content/uploads/2020/02/lose-weight.png',
    'https://reviewed-com-res.cloudinary.com/image/fetch/s--JRa2cRRE--/b_white,c_fill,cs_srgb,f_auto,fl_progressive.strip_profile,g_xy_center,q_auto,w_1200,x_948,y_535/https://reviewed-production.s3.amazonaws.com/1574281237048/yoga_mat_hero.jpg',
    'https://images.theconversation.com/files/478906/original/file-20220812-22-plgtr.jpg?ixlib=rb-1.1.0&q=45&auto=format&w=1200&h=900.0&fit=crop',
  ]

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
      <AnimatedImage source={getImage()}/>
      <View style={{flex: 1, alignItems: 'center', margin: 10}}>
        <CustomText type='header'>Select a goal</CustomText>
        <View style={styles.goalsContainer}>
          {setFitnessGoalsOptions.map((goal, index) => renderGoal(goal.name, index))}
        </View>
      </View>
      <Button
          title='Next'
          onPress={() => console.log('Pressed')}
          isPrimary
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