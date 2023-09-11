import { Keyboard, SafeAreaView, StyleSheet, Text, View } from 'react-native'
import React, { useState } from 'react'
import { CustomText } from '../../../components/text/customText'
import { colors } from '../../../colors'
import { AnimatedImage } from '../../../components/utils/AnimatedImage'
import { forgotPasswordAnimation } from '../../../animations/auth-flow'
import { Button } from '../../../components/buttons/button'
import { CustomTextInput } from '../../../components/text-input/CustomTextInput'
import { generalIcons } from '../../../components/icons/icon-library'
import { NavigationProp, useNavigation } from '@react-navigation/native'
import { AuthStackParams } from '../AuthStack'

export const ForgotPasswordScreen = () => {
    const navigation = useNavigation<NavigationProp<AuthStackParams, "EmailSentScreen">>();
    const appColors = colors();
    const [value, setValue] = useState<string>('');

    const emailRegex = /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/;

  return (
    <SafeAreaView onTouchStart={() => Keyboard.dismiss()} style={{flex: 1, backgroundColor: appColors.background, alignItems: 'center'}}>
        <View style={{flex: 1, margin: 10, justifyContent: 'space-around', alignItems: 'center'}}>
            <AnimatedImage
                source={forgotPasswordAnimation}
                size={250}
                loop={false}
            />
            <CustomText type='subheader'>Enter your email address to receive a verification code</CustomText>
        </View>
        <View style={{flex: 1, flexDirection: 'row', width: '90%'}}>
            <CustomTextInput
                value={value}
                onChangeText={setValue}
                placeholder='Email'
                leftIcon={generalIcons.envelope}
                keyboardType='email-address'
                returnKeyType='done'
            />
        </View>

        <Button
            label="Send"
            isActive={emailRegex.test(value)}
            onPress={() => navigation.navigate("EmailSentScreen")}
        />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({})