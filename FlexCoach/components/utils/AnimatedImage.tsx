import React, { useRef } from 'react'
import { Dimensions, Image, ImageSourcePropType, StyleSheet, View } from 'react-native';
import AnimatedLottieView from 'lottie-react-native';

interface AnimatedImageProps {
  source?: ImageSourcePropType;
}
  
export const AnimatedImage = ({ source }: AnimatedImageProps) => {
    const screenWidth = Dimensions.get('window').width;
    const screenHeight = Dimensions.get('window').height;
  
    return (
      <View style={[styles.container, { height: screenHeight / 3 }]}>
        <Image
          source={source}
          resizeMode='contain'
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
      height: '100%'
    },
  });