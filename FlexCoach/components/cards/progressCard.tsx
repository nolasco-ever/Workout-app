import React from 'react';
import { Dimensions, StyleSheet, View, useColorScheme } from 'react-native';
import { colors } from '../../colors';
import { CustomText } from '../text/customText';
import ProgressCircle from '../progress-indicators/progressCircle';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { ProgressBar } from '../progress-indicators/progressBar';

interface ProgressCardProps {
  title: string;
  goalAmount: number;
  currentAmount: number;
  type?: 'bar' | 'circle'
}

export const ProgressCard: React.FC<ProgressCardProps> = ({
  title,
  goalAmount,
  currentAmount,
  type = 'bar'
}) => {
    const appColors = colors();
    const progress = Math.round((currentAmount / goalAmount) * 100);
    const screenWidth = Dimensions.get('window').width;

    return type === 'bar' ? (
        <TouchableOpacity 
          style={[
            styles.container, 
            {
              backgroundColor: appColors.onBackground,
              shadowColor: '#000000',
              shadowOpacity: useColorScheme() === 'light' ? 0.1 : 0,
              shadowOffset: {width: 1, height: 1}
            }
          ]}
        >
            <View style={styles.infoContainer}>
                <View>
                    <CustomText style={styles.title}>{title} </CustomText>
                    <CustomText type='subheader' style={styles.statsText}>
                        {currentAmount} / {goalAmount}
                    </CustomText>
                </View>
                <ProgressBar
                  percent={(currentAmount / goalAmount)}
                />
            </View>
        </TouchableOpacity>
    ) : (
      <View style={{flex: 1}}>
      <TouchableOpacity 
        style={[
          styles.container, 
          {
            backgroundColor: appColors.onBackground, 
            height: screenWidth/2,
            shadowColor: '#000000',
            shadowOpacity: useColorScheme() === 'light' ? 0.1 : 0,
            shadowOffset: {width: 1, height: 1}
          }
        ]}
      >
          <View style={[styles.infoContainer, {alignItems: 'center'}]}>
              <ProgressCircle
                  percent={progress}
                  size='md'
              />
              <View style={styles.textContainer}>
                <CustomText type='header' style={styles.title}>{title} </CustomText>
                <CustomText type='subheader' style={styles.statsText}>
                    {currentAmount} / {goalAmount}
                </CustomText>
              </View>
          </View>
      </TouchableOpacity>
  </View>
    );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 10,
    padding: 10,
    margin: 10,
  },
  infoContainer: {
    flexDirection: 'column',
    justifyContent: 'space-between',
    margin: 5
  },
  textContainer: {
    marginTop: 10
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  statsText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});
