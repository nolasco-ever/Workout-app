import { Keyboard, SafeAreaView, StyleSheet, Text, View } from 'react-native'
import React, { useState } from 'react'
import { CustomText } from '../../../components/text/customText'
import { colors } from '../../../colors'
import { AnimatedImage } from '../../../components/utils/AnimatedImage'
import { forgotPasswordAnimation } from '../../../animations/auth-flow'
import { Button } from '../../../components/buttons/Button'
import { CustomTextInput } from '../../../components/text-input/customTextInput'
import { generalIcons } from '../../../components/icons/icon-library'

export const ForgotPasswordScreen = ({navigation}: {navigation: any}) => {
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
                placeholder='Email'
                icon={generalIcons.envelope}
                value={value}
                onChangeText={setValue}
                keyboardType='email-address'
                returnKeyType='done'
            />
        </View>

        <Button
            label="Send"
            isActive={emailRegex.test(value)}
            onPress={() => navigation.navigate('emailSentScreen')}
        />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({})