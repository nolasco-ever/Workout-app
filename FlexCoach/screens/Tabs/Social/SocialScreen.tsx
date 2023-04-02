import { IconProp } from '@fortawesome/fontawesome-svg-core';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView } from 'react-native';
import { colors } from '../../../colors';
import { tabIcons } from '../../../components/icons/icon-library';
import { CustomText } from '../../../components/text/customText';
import PostCard from '../../../components/cards/postCard';
import { photoPostMock, photoTextPostMock, textPostMock } from '../../../mocks/postMocks';


export const SocialScreen = () => {
  const appColors = colors();
  return (
    <SafeAreaView style={[styles.container, {backgroundColor: appColors.background}]}>
        {/* <FontAwesomeIcon icon={tabIcons.social as IconProp} color={appColors.inactive} size={50}/>
        <CustomText type='header' centered>Social</CustomText> */}
        <ScrollView>          
          <PostCard
            postID={photoPostMock.postID}
            profilePicture={photoPostMock.profilePicture}
            profileName={photoPostMock.profileName}
            postText={photoPostMock.postText}
            postImage={photoPostMock.postImage}
            likes={photoPostMock.likes}
            comments={photoPostMock.comments}
          />
          <PostCard
            postID={textPostMock.postID}
            profilePicture={textPostMock.profilePicture}
            profileName={textPostMock.profileName}
            postText={textPostMock.postText}
            postImage={textPostMock.postImage}
            likes={textPostMock.likes}
            comments={textPostMock.comments}
          />
          <PostCard
            postID={photoTextPostMock.postID}
            profilePicture={photoTextPostMock.profilePicture}
            profileName={photoTextPostMock.profileName}
            postText={photoTextPostMock.postText}
            postImage={photoTextPostMock.postImage}
            likes={photoTextPostMock.likes}
            comments={photoTextPostMock.comments}
          />
        </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1
  }
});