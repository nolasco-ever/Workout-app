import React from 'react';
import { ParamListBase } from '@react-navigation/native';
import { StyleSheet, TouchableOpacity, SafeAreaView, Dimensions, Text, View, KeyboardAvoidingView, Platform, Keyboard } from 'react-native';
import { colors } from '../../../colors';
import { CustomText } from '../../../components/text/customText';
import { StackNavigationProp } from '@react-navigation/stack';
import { generalIcons } from '../../../components/icons/icon-library';
import { CustomTextInput } from '../../../components/text-input/customTextInput';
import { Button } from '../../../components/buttons/button';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AnimatedImage } from '../../../components/utils/AnimatedImage';
import { welcomeAnimation } from '../../../animations/auth-flow';

interface SignInScreenProps {
    navigation: StackNavigationProp<ParamListBase>;
};
  
export const SignInScreen = ({ navigation }: SignInScreenProps) => {
  const appColors = colors();
  const screenWidth = Dimensions.get('window').width;

  const { top, bottom } = useSafeAreaInsets();
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
              source={welcomeAnimation}
              size={250}
            />
          </View>
          <View style={{margin: 10}}>
            <CustomText type='subheader'>
              It's great to see you! Sign in to continue
            </CustomText>
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
          <TouchableOpacity onPress={() => navigation.navigate('forgotPasswordScreen')}>
            <Text style={{color: appColors.subtext}}>Forgot Password?</Text>
          </TouchableOpacity>
        </View>
        <Button
          title='Sign In'
          isPrimary
          onPress={() => navigation.replace('Tabs')}
        />
        <Button
          title={`Don't have an account? Sign up here`}
          isPrimary={false}
          onPress={() => navigation.navigate('signUpScreen')}
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