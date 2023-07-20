import { Dimensions, Image, StyleSheet, Text, View } from 'react-native'
import React from 'react'
import { CustomText } from '../../components/text/customText';
import { colors } from '../../colors';

interface AuthorCardProps {
    photo: string;
    name: string;
    date: string;
    viewCount?: string;
}

export const AuthorCard = ({
    photo,
    name,
    date,
    viewCount,
}: AuthorCardProps) => {
    const appColors = colors();
    const screenWidth = Dimensions.get('window').width;

    return (
        <View style={styles.container}>
            <View style={{flexDirection: 'row'}}>
                <Image
                    source={{
                        uri: photo
                    }}
                    style={[styles.image, {height: screenWidth/8, width: screenWidth/8}]}
                />
                <View style={styles.nameDateContainer}>
                    <Text style={[styles.textBold, {color: appColors.text}]}>{name}</Text>
                    <Text style={[styles.textGrey, {color: appColors.subtext}]}>{date}</Text>
                </View>
            </View>
            {viewCount ? (
                <View style={styles.viewsContainer}>
                    <Text style={[styles.textBold, {color: appColors.text}]}>{viewCount}</Text>
                    <Text style={[styles.textGrey, {color: appColors.subtext}]}>Views</Text>
                </View>
            ) : null}
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 10,
        marginBottom: 10,
        // borderWidth: 1,
        // borderColor: 'red'
    },
    image: {
        borderRadius: 99,
    },
    nameDateContainer: {
        marginLeft: 10,
        justifyContent: 'center',
        // borderWidth: 1,
        // borderColor: 'red'
    },
    textBold: {
        fontWeight: 'bold',
        fontSize: 18,
    },
    textGrey: {
        fontSize: 12,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    viewsContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        // borderWidth: 1,
        // borderColor: 'red'
    },
})