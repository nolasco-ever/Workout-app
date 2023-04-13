import React from 'react'
import { Dimensions, Image, StyleSheet, Text, View } from 'react-native'
import { colors } from '../../colors'
import { TouchableOpacity } from 'react-native-gesture-handler';

interface ResultItemProps {
    title: string;
    description: string;
    imageSource: string;
    onPress: () => void;
}
export const ResultItem = ({title, description, imageSource, onPress}: ResultItemProps) => {
    const appColors = colors();
    const screenHeight = Dimensions.get('window').height

    return (
        <TouchableOpacity onPress={onPress} style={[styles.container, {height: screenHeight/10}]}>
            <Image
                source={{
                    uri: imageSource
                }}
                style={styles.image}
            />
            <View style={[styles.textContainer]}>
                <Text numberOfLines={1} ellipsizeMode='tail' style={[styles.title, {color: appColors.text}]}>{title}</Text>
                <Text numberOfLines={2} ellipsizeMode='tail' style={[styles.description, {color: appColors.subtext}]}>{description}</Text>
            </View>
        </TouchableOpacity>
    )
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 10
    },
    image: {
        height: '100%',
        width: '30%',
        borderRadius: 5
    },
    textContainer: {
        flex: 1,
        height: '100%',
        marginLeft: 15,
        justifyContent: 'flex-start'
    },
    title: {
        fontSize: 16,
        marginBottom: 5
    },
    description: {
        fontSize: 16
    }
})