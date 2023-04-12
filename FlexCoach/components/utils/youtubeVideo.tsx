import React, { useState } from 'react'
import { Dimensions, StyleSheet, Text, View } from 'react-native'
import YoutubeIframe from 'react-native-youtube-iframe';

interface YouTubeVideoProps {
    videoLink: string;
}

export const YouTubeVideo = ({videoLink}: YouTubeVideoProps) => {
  const screenHeight = Dimensions.get('window').height;
  const videoId = videoLink.split('v=')[1];
  const embedLink = `https://www.youtube.com/embed/${videoId}`;

  return (
    <View style={[styles.container]}>
      <YoutubeIframe
        height={screenHeight/4}
        videoId={videoId}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  }
});