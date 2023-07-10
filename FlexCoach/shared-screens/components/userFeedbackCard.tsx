import { Dimensions, ScrollView, StyleSheet, Text, TouchableOpacity, View, useColorScheme } from 'react-native'
import React, { useState } from 'react'
import { CustomText } from '../../components/text/customText'
import { colors } from '../../colors'
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome'
import { generalIcons } from '../../components/icons/icon-library'
import { useModalContext } from '../../packages/core-contexts/modal-context'

export const UserFeedbackCard = () => {
    const { openModal, setModalVisible } = useModalContext();
    const appColors = colors();
    const colorScheme = useColorScheme();
    const deviceHeight = Dimensions.get('window').height;

    const [liked, setLiked] = useState<boolean>(false);
    const [disliked, setDisliked] = useState<boolean>(false);

    const handleLiked = () => {
        setLiked(prev => !prev)
        setDisliked(false)
    }

    const handleDisliked = () => {
        setDisliked(prev => !prev);
        setLiked(false)
    }

    const CommentsModalComponent = () => {
        return (
            <View
                style={[
                    {
                        borderRadius: 10,
                        padding: 10,
                        backgroundColor: appColors.onBackground,
                        shadowColor: '#000000',
                        shadowOpacity: colorScheme === 'light' ? 0.1 : 0,
                        shadowOffset: {width: 1, height: 1},
                        height: deviceHeight * 0.6
                    }
                ]}
            >
                <ScrollView>
                    <CustomText centered>Comments will be shown here</CustomText>
                </ScrollView>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <TouchableOpacity 
            onPress={() => openModal(CommentsModalComponent())}
                style={[
                    styles.commentsContainerButton, 
                    {
                        backgroundColor: appColors.onBackground,
                        shadowColor: '#000000',
                        shadowOpacity: useColorScheme() === 'light' ? 0.1 : 0,
                        shadowOffset: {width: 1, height: 1}
                    }
                ]}
            >
                <CustomText>Comments - 54</CustomText>
            </TouchableOpacity>
            <View style={styles.likeDislikeContainer}>
                <TouchableOpacity onPress={() => handleLiked()}>
                    <FontAwesomeIcon
                        icon={liked ? generalIcons.thumbsUpFilled : generalIcons.thumbsUpOutline}
                        color={appColors.icon}
                        size={25}
                        style={{marginRight: 10}}
                    />
                </TouchableOpacity>

                <TouchableOpacity onPress={() => handleDisliked()}>
                    <FontAwesomeIcon
                        icon={disliked ? generalIcons.thumbsDownFilled : generalIcons.thumbsDownOutline}
                        color={appColors.icon}
                        size={25}
                    />
                </TouchableOpacity>
            </View>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        margin: 10,
        flexDirection: 'row'
    },
    commentsContainerButton: {
        justifyContent: 'center',
        borderRadius: 5,
        padding: 10,
        marginRight: 10,
        flex: 1
    },
    likeDislikeContainer: {
        flexDirection: 'row',
        margin: 10
    }
})