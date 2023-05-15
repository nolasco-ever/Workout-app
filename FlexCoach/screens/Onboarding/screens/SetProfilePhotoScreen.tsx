import { Dimensions, Image, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import React, { useState } from 'react'
import { colors } from '../../../colors'
import { user1 } from '../../../mocks/userMocks';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { generalIcons } from '../../../components/icons/icon-library';
import { IconProp } from '@fortawesome/fontawesome-svg-core';
import { Button } from '../../../components/buttons/button';

export const SetProfilePhotoScreen = ({navigation}: {navigation: any}) => {
    const appColors = colors();
    const screenWidth = Dimensions.get('window').width;

    const [selectedImage, setSelectedImage] = useState(null);

    return (
        <SafeAreaView style={[styles.container, {backgroundColor: appColors.background}]}>
            <View style={{flex: 1, alignItems: 'center'}}>
                <TouchableOpacity>
                    <Image
                        resizeMode='contain'
                        source={{
                            uri: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b5/Windows_10_Default_Profile_Picture.svg/768px-Windows_10_Default_Profile_Picture.svg.png'
                        }}
                        style={{borderRadius: 100, margin: 10, height: screenWidth/2, width: screenWidth/2}}
                    />
                    <FontAwesomeIcon
                        icon={generalIcons.penToSquare as IconProp}
                        color={appColors.icon}
                        size={30}
                        style={{position: 'absolute', right: 0, bottom: 0}}
                    />
                </TouchableOpacity>
            </View>
            <Button
                title='Next'
                isPrimary
                onPress={() => {}}
            />
            <Button
                title='Skip'
                isPrimary={false}
                onPress={() => {}}
                textColor={appColors.lightGrey}
            />
        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center'
      },
})