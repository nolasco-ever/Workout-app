import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../../colors';
import { CustomText } from '../text/customText';
import ProgressCircle from '../progress-indicators/progressCircle';

interface NutritionTrackerCardProps {
  dailyCalorieGoal: number;
  dailyProteinGoal: number;
  currentCaloriesConsumed: number;
  currentProteinConsumed: number;
}

export const NutritionTrackerCard: React.FC<NutritionTrackerCardProps> = ({
  dailyCalorieGoal,
  dailyProteinGoal,
  currentCaloriesConsumed,
  currentProteinConsumed,
}) => {
    const appColors = colors();
    const calorieProgress = Math.round((currentCaloriesConsumed / dailyCalorieGoal) * 100);
    const proteinProgress = Math.round((currentProteinConsumed / dailyProteinGoal) * 100);

    return (
        <View style={[styles.container, {backgroundColor: appColors.primary}]}>
            <CustomText type='header'>Nutrition Tracker</CustomText>
            <View style={styles.infoContainer}>
                <View style={styles.nutritionInfo}>
                    <CustomText style={styles.nutritionLabel}>Calories </CustomText>
                    <CustomText type='subheader' style={styles.nutritionValue}>
                        {currentCaloriesConsumed} / {dailyCalorieGoal}
                    </CustomText>
                </View>
                <ProgressCircle
                    percent={calorieProgress}
                    size='sm'
                />
            </View>
            <View style={styles.infoContainer}>
                <View style={styles.nutritionInfo}>
                    <CustomText style={styles.nutritionLabel}>Protein (g) </CustomText>
                    <CustomText type='subheader' style={styles.nutritionValue}>
                        {currentProteinConsumed} / {dailyProteinGoal}
                    </CustomText>
                </View>
                <ProgressCircle
                    percent={proteinProgress}
                    size='sm'
                />
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 15,
    padding: 20,
    margin: 10,
  },
  infoContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    alignItems: 'center'
  },
  progressCircle: {
    borderWidth: 5,
    borderRadius: 50,
    width: 80,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  progressLabel: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  nutritionInfo: {
    flex: 1,
    marginRight: 10,
    alignItems: 'center',
    flexDirection: 'row'
  },
  nutritionLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  nutritionValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});
