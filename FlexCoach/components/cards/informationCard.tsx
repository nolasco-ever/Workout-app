import React from 'react';
import { StyleSheet, View, Text, Image, TouchableOpacity, useColorScheme, Dimensions } from 'react-native';
import { colors } from '../../colors';

interface InformationCardProps {
  imageSource: string;
  title: string;
  description: string;
  onPress: () => void;
}

export const InformationCard = ({ imageSource, title, description, onPress }: InformationCardProps) => {
    const appColors = colors();
    const screenWidth = Dimensions.get('window').width;
    return (
        <TouchableOpacity
            style={[
                styles.container,
                {
                    backgroundColor: appColors.onBackground,
                    shadowColor: '#000000',
                    shadowOpacity: useColorScheme() === 'light' ? 0.1 : 0,
                    shadowOffset: {width: 1, height: 1},
                    height: screenWidth/3
                }
            ]} 
            onPress={onPress}
        >
            <View style={{flex: 1}}>
                <Image source={{ uri: imageSource }} style={styles.image} resizeMode="cover" />
            </View>
            <View style={styles.contentContainer}>
                <Text numberOfLines={1} ellipsizeMode='tail' style={[styles.title, {color: appColors.text}]}>{title}</Text>
                <Text numberOfLines={4} ellipsizeMode='tail' style={[styles.description, {color: appColors.subtext}]}>{description}</Text>
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    margin: 10
  },
  image: {
    height: '100%',
    width: '100%',
    borderTopLeftRadius: 10,
    borderBottomLeftRadius: 10
  },
  contentContainer: {
    flex: 2,
    padding: 10,
    height: '100%'
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  description: {
    fontSize: 16,
  },
});