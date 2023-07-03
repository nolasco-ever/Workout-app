import React from 'react'
import { Dimensions, Image, StyleSheet, Text, TouchableOpacity, View, useColorScheme } from 'react-native'
import { colors } from '../../colors';

interface CardProps {
    imageSource?: string;
    imageText?: string;
    title: string;
    onPress?: () => void;
    size?: 's' | 'l'
}

const screenWidth = Dimensions.get('screen').width;

export const Card = ({
    imageSource,
    imageText,
    title,
    onPress,
    size='s'
}: CardProps) => {
    const appColors = colors();
    
    return (
        <TouchableOpacity onPress={onPress} style={{margin: 10}}>
            <View 
                style={[
                    styles(size).container, 
                    {
                        backgroundColor: appColors.onBackground,
                        shadowColor: '#000000',
                        shadowOpacity: useColorScheme() === 'light' ? 0.1 : 0,
                        shadowOffset: {width: 1, height: 1}
                    }
                ]}
            >
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
                </View>
            </View>
        </TouchableOpacity>
    )
}

const styles = (size?: string) => StyleSheet.create({
    container: {
        width: size === 's' ? screenWidth/2 : '100%',
        borderRadius: 10,
    },
    imageContainer: {
        width: '100%',
        height: size === 's' ? screenWidth/4 : screenWidth/2
    },
    image: {
        height: '100%',
        width: '100%',
        borderTopLeftRadius: 5,
        borderTopRightRadius: 5
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
        padding: 10,
    },
    title: {
        fontWeight: 'bold',
        fontSize: size === 's' ? 16 : 18,
    },
  });