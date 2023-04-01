import React from 'react';
import { Dimensions, StyleSheet, Text, View } from 'react-native';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { colors } from '../../colors';

interface DayCardProps {
    number: number;
    dayName: string;
    isToday: boolean;
    isSelected: boolean;
    onPress: () => void;
}

export const DayCard = ({ number, dayName, isToday, isSelected, onPress }: DayCardProps) => {
    const appColors = colors();
    const screenWidth = Dimensions.get('window').width;
    return (
        <View style={[styles.wrapper, {height: screenWidth / 5,}]}>
            <TouchableOpacity onPress={onPress}>
                <View 
                    style={[
                        styles.container, 
                        {
                            height: screenWidth / 5,
                            backgroundColor: isSelected ? appColors.primary : appColors.background,
                            borderWidth: isSelected ? 0 : 1,
                            borderColor: appColors.inactive
                        }
                    ]}
                >
                    <Text style={[styles.number, {color: isSelected ? appColors.onPrimaryText : appColors.inactive}]}>{number}</Text>
                    <Text style={[styles.dayName, {color: isSelected ? appColors.onPrimaryText : appColors.inactive}]}>{dayName}</Text>
                    {isToday && 
                        <View 
                            style={[
                                styles.indicator, 
                                {
                                    height: screenWidth / 50,
                                    width: screenWidth / 50, 
                                    backgroundColor: appColors.accent
                                }
                            ]}
                        />
                    }
                </View>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    wrapper: {
        flex: 1,
        alignItems: 'stretch',
        justifyContent: 'center',
    },
    container: {
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        margin: 5,
    },
    number: {
        fontSize: 18
    },
    dayName: {
        fontSize: 12,
        fontWeight: 'bold'
    },
    indicator: {
        borderRadius: 50,
        position: 'absolute',
        bottom: '10%',
    }
  });