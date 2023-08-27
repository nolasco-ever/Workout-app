import React, { useEffect, useState } from 'react'
import { ActivityIndicator, Dimensions, StyleSheet, Text, View } from 'react-native'
import YoutubeIframe from 'react-native-youtube-iframe';
import { LoadingSpinnerView } from '../views/loadingSpinnerView';

interface YouTubeVideoProps {
    videoLink: string;
    autoPlay?: boolean;
    showControls?: boolean;
}

export const YouTubeVideo = ({
  videoLink,
  autoPlay = true,
  showControls = false
}: YouTubeVideoProps) => {
  const screenHeight = Dimensions.get('window').height;
  const videoId = videoLink.split('v=')[1];

  const [loading, setLoading] = useState(true);

  const handleOnReady = () => {
    setLoading(false);
  };

  return (
    <LoadingSpinnerView isLoading={loading} style={[styles.container, {height: screenHeight/4}]}>
      <YoutubeIframe
        height={screenHeight/4}
        videoId={videoId}
        onReady={handleOnReady}
        play={autoPlay}
        initialPlayerParams={{
          controls: showControls
        }}
      />
    </LoadingSpinnerView>
  )
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  loadingContainer: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  }
});