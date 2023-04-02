import { View, Text, Image, TouchableOpacity, StyleSheet, Dimensions } from 'react-native'
import React, { useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome'
import { IconProp } from '@fortawesome/fontawesome-svg-core'
import { TouchableWithoutFeedback } from 'react-native-gesture-handler'
import { CustomText } from '../text/customText'
import { generalIcons } from '../icons/icon-library'
import { colors } from '../../colors'

type addProps = {
    postID: string,
    profilePicture: string,
    profileName: string,
    postText?: string,
    postImage?: string,
    likes: number,
    comments: number
}

export default function PostCard({
    postID,
    profilePicture,
    profileName,
    postText,
    postImage,
    likes,
    comments
}:addProps) {
    const [liked, setLiked] = useState(false);
    const screenWidth = Dimensions.get('window').width;
    const appColors = colors();

    const commentCount = comments;
    const [likeCount, setLikeCount] = useState(likes);

    const handleLike = () => {
        setLiked(prev => !prev);

        if (liked) {
            setLikeCount(prev => prev-1);
        } else {
            setLikeCount(prev => prev+1);
        }
    }

  return (
    <View style={[postCardStyle.container, {borderColor: appColors.inactive,}]}>
        <TouchableOpacity style={postCardStyle.titleTextContainer}>
            <Image
                resizeMode='contain'
                source={{
                    width: 40,
                    height: 40,
                    uri: profilePicture
                }}
                style={{borderRadius: 100}}
            />
            <Text style={[postCardStyle.nameText, {color: appColors.text}]}>{profileName}</Text>
            <Text style={[postCardStyle.secondaryText, {color: appColors.subtext}]}>3h ago</Text>
        </TouchableOpacity>

        {postText ?
            <TouchableOpacity style={postCardStyle.bodyTextContainer}>
                <CustomText>{postText}</CustomText>
            </TouchableOpacity> : null
        }

        {postImage ?
            <View style={postCardStyle.imageContainer}>
                <Image
                    resizeMode='cover'
                    style={{
                        width: screenWidth,
                        height: screenWidth,
                        borderRadius: 5
                    }}
                    source={{
                        uri: postImage
                    }}
                />
                </View> : null
            }

        <View style={postCardStyle.actionsContainer}>
            <TouchableWithoutFeedback style={postCardStyle.actionItemContainer} onPress={() => handleLike()}>
                <FontAwesomeIcon
                    icon={generalIcons.heart as IconProp}
                    color={liked ? 'red' : appColors.inactive}
                    size={20}
                    style={{marginRight: 10}}
                />
                <CustomText>{likeCount}</CustomText>
            </TouchableWithoutFeedback>
            <View style={{marginLeft: 20}}/>
            <TouchableWithoutFeedback style={postCardStyle.actionItemContainer}>
                <FontAwesomeIcon
                    icon={generalIcons.comment as IconProp}
                    color={appColors.secondary}
                    size={20}
                    style={{marginRight: 10}}
                />
                <CustomText>{commentCount}</CustomText>
            </TouchableWithoutFeedback>
        </View>
    </View>
  )
}

const postCardStyle = StyleSheet.create({
    container: {
        borderBottomWidth: 0.25,
        marginBottom: 5
    },
    secondaryText: {
        fontSize: 14
    },
    nameText: {
        fontSize: 18,
        fontWeight: '600', 
        marginLeft: 10,
        marginRight: 10
    },
    titleTextContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 10
    },
    bodyTextContainer: {
        marginTop: 10,
        marginLeft: 10,
        marginBottom: 10
    },
    imageContainer: {
        alignItems: 'center',
        marginTop: 10
    },
    actionsContainer: {
        flexDirection: 'row',
        justifyContent: 'flex-start',
        padding: 10
    },
    actionItemContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    }
})