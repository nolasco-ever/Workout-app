import React from 'react'
import { Dimensions, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { colors } from '../../colors';

interface CardProps {
    imageSource?: string;
    imageText?: string;
    title: string;
    description?: string;
    onPress?: () => void;
    size?: 's' | 'l'
}

const screenWidth = Dimensions.get('screen').width;

export const Card = ({
    imageSource,
    imageText,
    title,
    description,
    onPress,
    size='s'
}: CardProps) => {
    const appColors = colors();
    
    return (
        <TouchableOpacity onPress={onPress} style={styles(size).container}>
            <View style={styles(size).imageContainer}>
                <Image
                    source={{uri: imageSource}}
                    style={styles().image}
                />
                {imageText && (
                    <View style={styles().imageTextContainer}>
                        <Text style={styles().imageText}>{imageText}</Text>
                    </View>
                )}
            </View>
            <View style={styles().contentContainer}>
                <Text numberOfLines={2} style={[styles(size).title, {color: appColors.text}]}>{title}</Text>
                {description && (
                    <Text numberOfLines={size === 's' ? 2 : 3} style={[styles(size).description, {color: appColors.text}]}>{description}</Text>
                )}
            </View>
        </TouchableOpacity>
    )
}

const styles = (size?: string) => StyleSheet.create({
    container: {
        padding: 10,
        width: size === 's' ? screenWidth/2 : screenWidth
    },
    imageContainer: {
        width: '100%',
        height: size === 's' ? screenWidth/4 : screenWidth/2
    },
    image: {
        height: '100%',
        width: '100%',
        borderRadius: 5,
    },
    imageTextContainer: {
        position: 'absolute',
        bottom: 0,
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
        paddingTop: 10,
    },
    title: {
        fontWeight: 'bold',
        fontSize: size === 's' ? 16 : 18,
    },
    description: {
        marginTop: 5,
        fontSize: size === 's' ? 14 : 16
    }
  });