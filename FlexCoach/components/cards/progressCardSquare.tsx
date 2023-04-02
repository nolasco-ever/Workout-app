import React, { useState } from 'react';
import { Dimensions, StyleSheet, Text, View } from 'react-native';
import { colors } from '../../colors';
import { CustomText } from '../text/customText';
import ProgressCircle from '../progress-indicators/progressCircle';
import { TouchableOpacity } from 'react-native-gesture-handler';

interface ProgressCardSquareProps {
  title: string;
  goalAmount: number;
  currentAmount: number;
}

export const ProgressCardSquare: React.FC<ProgressCardSquareProps> = ({
  title,
  goalAmount,
  currentAmount,
}) => {
    const appColors = colors();
    const calorieProgress = Math.round((currentAmount / goalAmount) * 100);
    const screenWidth = Dimensions.get('window').width;

    return (
        <View style={{flex: 1}}>
            <TouchableOpacity style={[styles.container, {backgroundColor: appColors.primary, height: screenWidth/2}]}>
                <View style={styles.infoContainer}>
                    <ProgressCircle
                        percent={calorieProgress}
                        size='md'
                    />
                    <CustomText type='header' style={styles.nutritionLabel}>{title} </CustomText>
                    <CustomText type='subheader' style={styles.nutritionValue}>
                        {currentAmount} / {goalAmount}
                    </CustomText>
                </View>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 15,
    padding: 10,
    margin: 10
  },
  infoContainer: {
    height:'100%',
    flexDirection: 'column',
    justifyContent: 'space-around',
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
