import React, { useRef } from 'react'
import { Dimensions, Image, ImageSourcePropType, StyleSheet, View } from 'react-native';
import LottieView, { AnimationObject } from 'lottie-react-native'

interface AnimatedImageProps {
  source: string | AnimationObject | {
    uri: string;
  }
  loop?: boolean
}
  
export const AnimatedImage = ({ source, loop=true }: AnimatedImageProps) => {
    const screenHeight = Dimensions.get('window').height;
  
    return (
      <View style={[styles.container, { height: screenHeight / 3 }]}>
        <LottieView
          source={source}
          autoPlay={true}
          loop={loop}
        />
      </View>
    );
};

const styles = StyleSheet.create({
  container: {
    padding: 10,
    width: '100%',
  },
  animation: {
    width: '100%',
    height: '100%'
  },
});