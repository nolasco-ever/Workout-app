import { Keyboard, KeyboardAvoidingView, Platform, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import React from 'react'
import { CustomText } from '../../../components/text/customText'
import { signUpAnimation } from '../../../animations/auth-flow'
import { generalIcons } from '../../../components/icons/icon-library'
import { CustomTextInput } from '../../../components/text-input/CustomTextInput'
import { AnimatedImage } from '../../../components/utils/AnimatedImage'
import { NavigationProp, ParamListBase, StackActions, useNavigation } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack'
import { colors } from '../../../colors'
import { Button } from '../../../components/buttons/button'
import { AppStackParams } from '../../../appNavigators/AppStack'

export const SignUpScreen = () => {
    const navigation = useNavigation<NavigationProp<AppStackParams>>();

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
                            leftIcon={generalIcons.envelope}
                            placeholder='Email'
                        />
                    </View>
                    <View style={styles.textInputContainer}>
                        <CustomTextInput
                            leftIcon={generalIcons.key}
                            placeholder='Password'
                            isSecure
                        />
                    </View>
                    <View style={styles.textInputContainer}>
                        <CustomTextInput
                            leftIcon={generalIcons.key}
                            placeholder='Confirm Password'
                            isSecure
                        />
                    </View>
                </View>
                <Button
                    label='Sign Up'
                    onPress={() => navigation.dispatch(StackActions.replace('OnboardingStack'))}
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