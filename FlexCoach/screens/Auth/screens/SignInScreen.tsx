import React from 'react';
import { NavigationProp, ParamListBase, StackActions, useNavigation } from '@react-navigation/native';
import { StyleSheet, TouchableOpacity, SafeAreaView, Dimensions, Text, View, KeyboardAvoidingView, Platform, Keyboard } from 'react-native';
import { colors } from '../../../colors';
import { CustomText } from '../../../components/text/customText';
import { StackNavigationProp } from '@react-navigation/stack';
import { generalIcons } from '../../../components/icons/icon-library';
import { CustomTextInput } from '../../../components/text-input/CustomTextInput';
import { AnimatedImage } from '../../../components/utils/AnimatedImage';
import { welcomeAnimation } from '../../../animations/auth-flow';
import { Button } from '../../../components/buttons/button';
import { AuthStackParams } from '../AuthStack';
import { AppStackParams } from '../../../appNavigators/AppStack';
  
export const SignInScreen = () => {
  const navigation = useNavigation<NavigationProp<AuthStackParams | AppStackParams>>();

  const appColors = colors();
  const screenWidth = Dimensions.get('window').width;

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
          <TouchableOpacity onPress={() => (navigation as NavigationProp<AuthStackParams>).navigate('ForgotPasswordScreen')}>
            <Text style={{color: appColors.subtext}}>Forgot Password?</Text>
          </TouchableOpacity>
        </View>
        <Button
          label='Sign In'
          onPress={() => navigation.dispatch(StackActions.replace('TabNavigator'))}
        />
        <Button
          label={`Don't have an account? Sign up here`}
          type='outline'
          onPress={() => (navigation as NavigationProp<AuthStackParams>).navigate('SignUpScreen')}
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