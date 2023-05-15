import { Keyboard, KeyboardAvoidingView, Platform, SafeAreaView, StyleSheet, Text, View } from 'react-native'
import React from 'react'
import { generalIcons } from '../../../components/icons/icon-library'
import { CustomTextInput } from '../../../components/text-input/customTextInput'
import { CustomText } from '../../../components/text/customText'
import { AnimatedImage } from '../../../components/utils/AnimatedImage'
import { Button } from '../../../components/buttons/button'
import { colors } from '../../../colors'
import { createUserProfileAnimation } from '../../../animations/onboarding-flow'
import { NumberPicker } from '../../../components/Pickers/numberPicker'
import { Section } from '../../../components/sections/Section'

export const UserProfileInfoScreen = ({navigation}: {navigation: any}) => {
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
                            source={createUserProfileAnimation}
                            size={250}
                            loop={true}
                            />
                        </View>
                        <View style={{margin: 10}}>
                            <CustomText type='subheader'>
                                Enter your first name, last name, height, and weight for a personalized experience
                            </CustomText>
                        </View>
                        <View style={styles.textInputContainer}>
                            <CustomTextInput
                                icon={generalIcons.user}
                                placeholder='First Name'
                                returnKeyType='done'
                            />
                        </View>
                        <View style={styles.textInputContainer}>
                            <CustomTextInput
                                icon={generalIcons.user}
                                placeholder='Last Name'
                                returnKeyType='done'
                            />
                        </View>
                        <View style={styles.textInputContainer}>
                            <CustomTextInput
                                icon={generalIcons.user}
                                placeholder='Weight (lbs)'
                                keyboardType='number-pad'
                                returnKeyType='done'
                            />
                        </View>
                        <Section title='Height'>
                            <View style={{flexDirection: 'row'}}>
                                <NumberPicker
                                    label='Feet'
                                    min={1}
                                    max={7}
                                    onValueChange={() => {}}
                                />
                                <NumberPicker
                                    label='Inches'
                                    min={0}
                                    max={12}
                                    onValueChange={() => {}}
                                />
                            </View>
                        </Section>
                    </View>
                    <Button
                    title='Next'
                    isPrimary
                    onPress={() => navigation.navigate('setProfilePhotoScreen')}
                    />
                </SafeAreaView>
            </KeyboardAvoidingView>
        );
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