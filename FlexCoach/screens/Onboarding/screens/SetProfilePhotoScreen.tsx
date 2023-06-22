import { Dimensions, Image, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import React, { useState } from 'react'
import { colors } from '../../../colors'
import { user1 } from '../../../mocks/userMocks';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { generalIcons } from '../../../components/icons/icon-library';
import { IconProp } from '@fortawesome/fontawesome-svg-core';
import { Button } from '../../../components/buttons/button';
import { launchImageLibrary, launchCamera, Asset, ImageLibraryOptions, CameraOptions } from 'react-native-image-picker';
import { CustomText } from '../../../components/text/customText';

export const SetProfilePhotoScreen = ({navigation}: {navigation: any}) => {
    const appColors = colors();
    const screenWidth = Dimensions.get('window').width;

    const [selectedImage, setSelectedImage] = useState<Asset[] | undefined>();

    const openLibrary = () => {
        const options: ImageLibraryOptions = {
            mediaType: 'photo',
            presentationStyle: 'pageSheet'
        };

        launchImageLibrary(options, response => {
            setSelectedImage(response.assets)
        })
    }

    const openCamera = () => {
        const options: CameraOptions = {
            saveToPhotos: true,
            mediaType: 'photo',
            presentationStyle: 'fullScreen'
        };

        launchCamera(options, response => {
            setSelectedImage(response.assets);
        })
    }

    return (
        <SafeAreaView style={[styles.container, {backgroundColor: appColors.background}]}>
            <View style={{padding: 10}}>
                <CustomText type='subheader'>Let's set a profile photo and start building connections within our fitness community</CustomText>
            </View>
            <View style={{flex: 1, alignItems: 'center'}}>
                <View>
                    <Image
                        resizeMode='cover'
                        source={{
                            uri: selectedImage ? selectedImage[0].uri : 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b5/Windows_10_Default_Profile_Picture.svg/768px-Windows_10_Default_Profile_Picture.svg.png'
                        }}
                        style={{borderRadius: 100, margin: 10, height: screenWidth/2, width: screenWidth/2}}
                    />
                </View>

                <Button
                    label="Choose from library"
                    type='text'
                    onPress={openLibrary}
                />
                <Button
                    label="Take photo"
                    type='text'
                    onPress={openCamera}
                />
            </View>
            <Button
                label='Next'
                onPress={() => navigation.navigate('designYourPlan')}
            />
            <Button
                label='Maybe Later'
                type='outline'
                onPress={() => navigation.navigate('designYourPlan')}
            />
        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
      },
})