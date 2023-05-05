import { Keyboard, KeyboardAvoidingView, Platform, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import React from 'react'
import { CustomText } from '../../../components/text/customText'
import { signUpAnimation } from '../../../animations/auth-flow'
import { generalIcons } from '../../../components/icons/icon-library'
import { CustomTextInput } from '../../../components/text-input/customTextInput'
import { AnimatedImage } from '../../../components/utils/AnimatedImage'
import { ParamListBase } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack'
import { colors } from '../../../colors'
import { Button } from '../../../components/buttons/button'

interface SignUpScreenProps {
    navigation: StackNavigationProp<ParamListBase>;
};

export const SignUpScreen = ({navigation}: SignUpScreenProps) => {
    const appColors = colors();
    
    return (
        <KeyboardAvoidingView
        style={{flex: 1}}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
        onTouchStart={() => Keyboard.dismiss}
        >
        <SafeAreaView style={[styles.container, {backgroundColor: appColors.background}]} onTouchStart={() => Keyboard.dismiss()}>
            <View style={{flex: 1, marginBottom: 30, alignItems: 'center'}}>
                <View style={{flex: 1, justifyContent: 'center'}}>
                    <AnimatedImage
                    source={signUpAnimation}
                    size={250}
                    loop={false}
                    />
                </View>
                <View style={{margin: 10}}>
                    <CustomText type='subheader'>
                        Create an account to start your fitness journey!
                    </CustomText>
                </View>
                <View style={styles.textInputContainer}>
                    <CustomTextInput
                    icon={generalIcons.envelope}
                    placeholder='Full Name'
                    />
                </View>
                <View style={styles.textInputContainer}>
                    <CustomTextInput
                    icon={generalIcons.envelope}
                    placeholder='Email'
                    />
                </View>
                <View style={styles.textInputContainer}>
                    <CustomTextInput
                    icon={generalIcons.key}
                    placeholder='Password'
                    isPassword
                    />
                </View>
                <View style={styles.textInputContainer}>
                    <CustomTextInput
                    icon={generalIcons.key}
                    placeholder='Confirm Password'
                    isPassword
                    />
                </View>
            </View>
            <Button
            title='Sign Up'
            isPrimary
            onPress={() => navigation.replace('Tabs')}
            />
        </SafeAreaView>
        </KeyboardAvoidingView>
    )
}

const styles = StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center'
    },
    button: {
      flexDirection:'row',
      justifyContent: 'space-around',
      borderRadius: 50,
      padding: 10,
      alignItems: 'center'
    },
    textInputContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 10,
      width: '90%'
    }
  });