import React from 'react'
import { Dimensions, StyleSheet, View } from 'react-native';
import AnimatedLottieView from 'lottie-react-native';

interface AnimatedImageProps {
    animationPath?: string;
  }
  
export const AnimatedImage = ({ animationPath }: AnimatedImageProps) => {
    const screenWidth = Dimensions.get('window').width;
    const screenHeight = Dimensions.get('window').height;

  
    return (
      <View style={[styles.container, { height: screenHeight / 3 }]}>
        <AnimatedLottieView
          source={require('../../animations/custom-training-program-flow/animations/bench-press.json')}
          autoPlay
          loop
          style={styles.animation}
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
      height: '100%',
    },
  });