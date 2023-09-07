import React from 'react'
import { Dimensions, Image, StyleSheet, Text, TouchableOpacity, View, useColorScheme } from 'react-native'
import { colors } from '../../colors';

interface CardProps {
    imageSource?: string;
    imageText?: string;
    title: string;
    subtitle?: string;
    onPress?: () => void;
}

const screenWidth = Dimensions.get('screen').width;

export const Card = ({
    imageSource,
    imageText,
    title,
    subtitle,
    onPress,
}: CardProps) => {
    const appColors = colors();
    
    return (
        <TouchableOpacity onPress={onPress} style={{margin: 10}}>
            <View 
                style={styles.container}
            >
                <View style={styles.imageContainer}>
                    <Image
                        source={{uri: imageSource}}
                        style={styles.image}
                    />
                    {imageText && (
                        <View style={styles.imageTextContainer}>
                            <Text style={styles.imageText}>{imageText}</Text>
                        </View>
                    )}
                </View>
                <View style={styles.contentContainer}>
                    <Text numberOfLines={2} style={[styles.title, {color: appColors.text}]}>{title}</Text>
                    <Text numberOfLines={1} style={[styles.subtitle, {color: appColors.subtext}]}>{subtitle}</Text>
                </View>
            </View>
        </TouchableOpacity>
    )
}

const styles = StyleSheet.create({
    container: {
        width: screenWidth/2,
        borderRadius: 10,
    },
    imageContainer: {
        width: '100%',
        height: screenWidth/4
    },
    image: {
        height: '100%',
        width: '100%',
        borderRadius: 5
    },
    imageTextContainer: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        margin: 5,
        backgroundColor: 'rgba(0,0,0,0.5)',
        padding: 5,
        borderRadius: 5,
        justifyContent: 'center',
        alignItems: 'center'
    },
    imageText: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#fff'
    },
    contentContainer: {
        padding: 5,
    },
    title: {
        fontWeight: '500',
        fontSize: 16
    },
    subtitle: {
        fontSize: 10
    }
  });