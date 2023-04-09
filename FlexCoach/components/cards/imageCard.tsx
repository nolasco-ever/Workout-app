import { Dimensions, Image, StyleSheet, Text, View, useColorScheme } from 'react-native'
import React from 'react'

interface ImageCardProps {
    imageUrl: string
}

export const ImageCard = ({imageUrl}: ImageCardProps) => {
    const screenWidth = Dimensions.get('window').width;
    const screenHeight = Dimensions.get('window').height;
    return (
        <View style={[styles.container, {height: screenHeight/3}]}>
            <Image
                resizeMode='cover'
                source={{
                    uri: imageUrl
                }}
                style={[
                    styles.image,
                    {
                        shadowOpacity: useColorScheme() === 'light' ? 0.1 : 0,
                    }
                ]}
            />
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        padding: 10,
        width: '100%'
    },
    image: {
        width: '100%', 
        height: '100%', 
        borderRadius: 10,
        shadowColor: '#000000',
        shadowOffset: {
            width: 1, 
            height: 1
        }
    }
})