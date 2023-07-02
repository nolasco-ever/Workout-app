import React from 'react';
import { StyleSheet, View, Text, Image, TouchableOpacity, useColorScheme, Dimensions } from 'react-native';
import { colors } from '../../colors';

interface InformationCardSmallProps {
  imageSource: string;
  title: string;
  onPress: () => void;
  size?: 'l' | 's'
}

export const InformationCardSmall = ({ imageSource, title, onPress, size='s' }: InformationCardSmallProps) => {
    const appColors = colors();
    const screenWidth = Dimensions.get('window').width;
    const numCardsPerRow = size === 'l' ? 1 : 2;
    const cardWidth = (screenWidth - 14 * (numCardsPerRow + 1)) / numCardsPerRow;
    const cardHeight = screenWidth/4;
    const fontSize = size === 's' ? 16 : 20;

    return (
        <TouchableOpacity onPress={onPress} style={[styles.container, { width: cardWidth }]}>
            <Image
                source={{ uri: imageSource }} 
                style={{width: '100%', height: cardWidth/2, marginBottom: 5, borderRadius: 5}}
            />
            <View style={{marginTop: 10}}>
                <Text numberOfLines={2} ellipsizeMode='tail' style={[styles.title, {color: appColors.text, fontSize: fontSize}]}>{title}</Text>
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
  container: {
    margin: 10,
  },
  image: {
    height: '100%',
    width: '100%',
    borderRadius: 10,
    backgroundColor: 'blue'
  },
  contentContainer: {
    padding: 10,
    height: '100%',
  },
  title: {
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 5,
  },
});
