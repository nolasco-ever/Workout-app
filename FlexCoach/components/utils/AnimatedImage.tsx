import React, { useRef } from 'react'
import { Dimensions, Image, ImageSourcePropType, StyleSheet, View } from 'react-native';
import LottieView, { AnimationObject } from 'lottie-react-native'

interface AnimatedImageProps {
  source: string | AnimationObject | {
    uri: string;
  }
  loop?: boolean,
  size?: number
}
  
export const AnimatedImage = ({ source, loop=true, size }: AnimatedImageProps) => {
    const screenHeight = Dimensions.get('window').height;
    const style = size ? { height: size, width: size} : {}
  
    return (
      <View style={[styles.container, { height: screenHeight / 3 }]}>
        <LottieView
          source={source}
          autoPlay={true}
          loop={loop}
          style={style}
        />
      </View>
    );
};

const styles = StyleSheet.create({
  container: {
    padding: 10,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center'
  },
  animation: {
    width: '100%',
    height: '100%'
  },
});