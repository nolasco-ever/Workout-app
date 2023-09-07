import React from 'react';
import { Dimensions, StyleSheet, Text, View, useColorScheme } from 'react-native';
import { colors } from '../../colors';
import { CustomText } from '../text/customText';
import ProgressCircle from '../progress-indicators/progressCircle';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { ProgressBar } from '../progress-indicators/progressBar';
import { IconProp } from '@fortawesome/fontawesome-svg-core';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';

interface ProgressCardProps {
  title: string;
  goalAmount: number;
  currentAmount: number;
  unit?: string;
  icon?: IconProp;
  color?: string;
  type?: 'bar' | 'circle'
}

export const ProgressCard: React.FC<ProgressCardProps> = ({
  title,
  goalAmount,
  currentAmount,
  unit,
  icon,
  color,
  type = 'bar'
}) => {
    const appColors = colors();
    const progress = Math.round((currentAmount / goalAmount) * 100);
    // const screenWidth = Dimensions.get('window').width;

    const titleStyle = {
      fontSize: type === 'bar' ? 16 : 18,
      fontWeight: 'bold',
      marginBottom: 5
    }

    return type === 'bar' ? (
      <View style={{flex: 1}}>
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
          <View style={{flexDirection: 'row', alignItems: 'center'}}>
            {icon && (
              <FontAwesomeIcon
                icon={icon}
                color={color || appColors.icon}
                size={30}
              />
            )}
            <View style={styles.infoContainer}>
                <View style={{flexDirection: 'row', alignItems: 'center', marginBottom: 5}}>
                    <Text style={titleStyle}>{title} </Text>
                    <Text style={[styles.statsText, {color: appColors.subtext}]}>
                        {currentAmount} / {goalAmount} {unit}
                    </Text>
                </View>
                <ProgressBar
                  percent={(currentAmount / goalAmount)}
                  fillColor={color || appColors.icon}
                />
            </View>
          </View>
        </TouchableOpacity>
      </View>
    ) : (
      <View style={{flex: 1}}>
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
          <View style={[styles.infoContainer, {alignItems: 'center'}]}>
              <Text style={titleStyle}>{title} </Text>
              <ProgressCircle
                  percent={progress}
                  centerText={`${currentAmount}/${goalAmount}${unit ? `\n${unit}` : ''}`}
                  size='md'
                  fillColor={color}
              />
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
    padding: 5
  },
  textContainer: {
    marginBottom: 5,
    alignItems: 'center'
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  statsText: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 5
  },
});
