import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native'
import React from 'react'
import { AnimatedImage } from '../utils/AnimatedImage'
import { loadingSpinnerAnimation } from '../../animations/shared'

interface LoadingSpinnerViewProps {
  children: React.ReactNode,
  style?: StyleProp<ViewStyle>,
  isLoading: boolean
}

export const LoadingSpinnerView = ({children, style, isLoading}: LoadingSpinnerViewProps) => {
  return (
    <View style={style ? style : {height: '100%', width: '100%'}}>
      {isLoading && (
        <View style={styles.loadingContainer}>
          <AnimatedImage
            source={loadingSpinnerAnimation}
            size={100}
          />
        </View>
      )}
      {children}
    </View>
  )
}

const styles = StyleSheet.create({
  loadingContainer: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  }
})