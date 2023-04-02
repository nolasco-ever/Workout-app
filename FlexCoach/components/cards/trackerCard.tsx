import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../../colors';
import { CustomText } from '../text/customText';
import ProgressCircle from '../progress-indicators/progressCircle';

interface TrackerCardProps {
  title: string;
  goalAmount: number;
  currentAmount: number;
}

export const TrackerCard: React.FC<TrackerCardProps> = ({
  title,
  goalAmount,
  currentAmount,
}) => {
    const appColors = colors();
    const calorieProgress = Math.round((currentAmount / goalAmount) * 100);

    return (
        <View style={[styles.container, {backgroundColor: appColors.primary}]}>
            <View style={styles.infoContainer}>
                <View style={styles.nutritionInfo}>
                    <CustomText type='header' style={styles.nutritionLabel}>{title} </CustomText>
                    <CustomText type='subheader' style={styles.nutritionValue}>
                        {currentAmount} / {goalAmount}
                    </CustomText>
                </View>
                <ProgressCircle
                    percent={calorieProgress}
                    size='sm'
                />
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 15,
    padding: 10,
    margin: 10,
  },
  infoContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    margin: 5,
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
