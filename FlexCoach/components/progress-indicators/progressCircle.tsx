import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { CustomText } from '../text/customText';
import { colors } from '../../colors';

interface ProgressCircleProps {
  percent: number;
  centerText?: string;
  centerTextSize?: 'sm' | 'lg';
  size?: 'sm' | 'md' | 'lg';
  fillColor?: string;
}

export default function ProgressCircle({
  percent,
  centerText,
  centerTextSize = 'sm',
  size = 'lg',
  fillColor,
}: ProgressCircleProps) {
  const screenWidth = Dimensions.get('window').width;
  const appColors = colors();
  const dimensionsMultiplier = size === 'sm' ? 0.15 : size === 'md' ? 0.3 : 0.4;
  const borderWidth = size === 'sm' ? 5 : size === 'md' ? 12 : 20;

  const styleFromProp = (percent: number, base_degrees: number) => {
    const rotateBy = base_degrees + percent * 3.6;

    return {
      transform: [{ rotateZ: `${rotateBy}deg` }],
    };
  };

  const renderThirdLayer = (percent: number) => {
    if (percent > 50) {
      return (
        <View
          style={[
            progressCircleStyle.thirdLayer,
            {
              borderWidth: 5,
              width: screenWidth * dimensionsMultiplier,
              height: screenWidth * dimensionsMultiplier,
              borderRadius: screenWidth * 0.2,
              borderColor: fillColor || appColors.primary,
              transform: [{ rotateZ: '45deg' }],
            },
            styleFromProp(percent - 50, 45),
          ]}
        />
      );
    } else {
      return (
        <View
          style={[
            progressCircleStyle.thirdLayer,
            {
              borderWidth: 5,
              width: screenWidth * dimensionsMultiplier,
              height: screenWidth * dimensionsMultiplier,
              borderRadius: screenWidth * 0.2,
              borderColor: appColors.inactive,
              transform: [{ rotateZ: '-135deg' }],
            },
          ]}
        />
      );
    }
  };

  let firstProgressLayerStyle;
  if (percent > 50) {
    firstProgressLayerStyle = styleFromProp(50, -135);
  } else {
    firstProgressLayerStyle = styleFromProp(percent, -135);
  }

  return (
    <View
      style={[
        progressCircleStyle.container,
        {
          borderWidth: 5,
          borderColor: appColors.inactive,
          width: screenWidth * dimensionsMultiplier,
          height: screenWidth * dimensionsMultiplier,
          borderRadius: screenWidth * 0.2,
        },
      ]}
    >
      <View
        style={[
          progressCircleStyle.firstLayer,
          {
            borderWidth: 5,
            borderColor: fillColor || appColors.primary,
            width: screenWidth * dimensionsMultiplier,
            height: screenWidth * dimensionsMultiplier,
            borderRadius: screenWidth * 0.2,
          },
          firstProgressLayerStyle,
        ]}
      />
      {renderThirdLayer(percent)}
      <CustomText type={centerTextSize === 'sm' ? 'body' : 'header'} centered>
        {centerText || `${percent}%`}
      </CustomText>
    </View>
  );
}

const progressCircleStyle = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  firstLayer: {
    position: 'absolute',
    borderLeftColor: 'transparent',
    borderBottomColor: 'transparent',
    transform: [{ rotateZ: '-45deg' }],
  },
  thirdLayer: {
    position: 'absolute',
    borderLeftColor: 'transparent',
    borderBottomColor: 'transparent',
  },
});
