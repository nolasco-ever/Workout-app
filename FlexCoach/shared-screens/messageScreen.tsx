import { SafeAreaView, StyleSheet, Text, View } from 'react-native'
import React from 'react'
import { colors } from '../colors';
import { AnimatedImage } from '../components/utils/AnimatedImage';
import { CustomText } from '../components/text/customText';
import { Button } from '../components/buttons/button';
import { CommonActions, StackActions, useNavigation } from '@react-navigation/native';

const MessageScreen = ({route}: {route: any}) => {
    const navigation = useNavigation<any>();
    const {title, message, image, imageLoop, buttonTitle, buttonAction, navigateTo, replaceWith, popToTop} = route.params;
    const appColors = colors();

    const handlePress = () => {
        if (buttonAction) {
            buttonAction();
        } else if (popToTop) {
            navigation.dispatch(StackActions.popToTop());
        } else if (replaceWith) {
            navigation.dispatch(StackActions.replace(replaceWith));
        } else if (navigateTo) {
            navigation.navigate(navigateTo);
        } else {
            navigation.navigate('TabNavigator');
        }
    };

    return (
        <SafeAreaView style={[styles.container, {backgroundColor: appColors.background}]}>
            <View style={{flex: 1, padding: 10, justifyContent: 'flex-end'}}>
                <AnimatedImage source={image} loop={imageLoop ? imageLoop : false} size={250}/>
            </View>
            <View style={{flex: 1, padding: 10, justifyContent: 'flex-start'}}>
                <CustomText centered type='header'>{title}</CustomText>
                <View style={{marginTop: 10}}>
                    <CustomText centered type='subheader'>{message}</CustomText>
                </View>
            </View>
            <Button
                label={buttonTitle}
                onPress={handlePress}
            />
        </SafeAreaView>
    )
}

export default MessageScreen

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
      },
})