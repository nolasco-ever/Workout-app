import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { authService, passwordOk, passwordRules } from '../../../data/auth/authService';
import { Icon } from '../../../components/icons/Icon';
import { generalIcons } from '../../../components/icons/icon-library';
import { CustomText } from '../../../components/text/customText';
import { TextField } from '../../../components/inputs/TextField';
import { PrimaryButton } from '../../../components/buttons/PrimaryButton';
import { useTheme } from '../../../theme';
import { AuthStackParams } from '../AuthStack';

const validEmail = (s: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.trim());


/** One screen for both sign in and create account; the mode toggles at the bottom. */
export const EmailAuthScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<AuthStackParams>>();
  const { params } = useRoute<RouteProp<AuthStackParams, 'EmailAuthScreen'>>();
  const { colors, spacing } = useTheme();
  const [mode, setMode] = useState(params.mode);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const create = mode === 'create';
  const canSubmit = validEmail(email) && (create ? passwordOk(password) && confirm === password && name.trim().length > 0 : password.length > 0);

  const submit = async () => {
    setBusy(true);
    setError(null);
    try {
      if (create) await authService.createWithEmail(email, password, name);
      else await authService.signInWithEmail(email, password);
      // AppStack switches routes when the auth state changes.
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setBusy(false);
    }
  };

  const switchMode = () => {
    const next = create ? 'signin' : 'create';
    setMode(next);
    setError(null);
    setConfirm('');
    navigation.setOptions({ title: next === 'create' ? 'Create account' : 'Sign in' });
  };

  return (
    <SafeAreaView edges={['bottom', 'left', 'right']} style={{ flex: 1, backgroundColor: colors.ground }}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }} keyboardVerticalOffset={100}>
        <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.lg }} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag">
          {create && <TextField id="auth-name" label="Your name" placeholder="Full Name" value={name} onChangeText={setName} autoCapitalize="words" autoComplete="name" textContentType="name" returnKeyType="next" autoFocus />}
          <TextField id="auth-email" label="Email" placeholder="you@example.com" value={email} onChangeText={setEmail} autoCapitalize="none" autoCorrect={false} keyboardType="email-address" autoComplete="email" textContentType="emailAddress" returnKeyType="next" autoFocus={!create} />
          <View style={{ gap: spacing.xs }}>
            <TextField
              id="auth-password"
              label="Password"
              placeholder={create ? undefined : 'Your password'}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              autoComplete={create ? 'new-password' : 'current-password'}
              textContentType={create ? 'newPassword' : 'password'}
              returnKeyType={create ? 'next' : 'go'}
              onSubmitEditing={() => !create && canSubmit && submit()}
            />
            <TouchableOpacity onPress={() => setShowPassword(s => !s)} hitSlop={8} style={{ alignSelf: 'flex-start' }}>
              <CustomText variant="caption" color={colors.inkMuted}>{showPassword ? 'Hide password' : 'Show password'}</CustomText>
            </TouchableOpacity>
          </View>
          {create && (
            <View style={{ gap: spacing.sm }}>
              <TextField
                id="auth-confirm"
                label="Confirm password"
                value={confirm}
                onChangeText={setConfirm}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoComplete="new-password"
                textContentType="newPassword"
                returnKeyType="go"
                onSubmitEditing={() => canSubmit && submit()}
                error={confirm.length > 0 && confirm !== password ? "Passwords don't match." : null}
              />
              <View style={{ gap: spacing.xs }}>
                {passwordRules.map(rule => {
                  const met = rule.test(password);
                  return (
                    <View key={rule.label} style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
                      <Icon icon={met ? generalIcons.success : generalIcons.bulletPoint} size={16} color={met ? colors.success : colors.inactive} />
                      <CustomText variant="caption" color={met ? colors.ink : colors.inkMuted}>{rule.label}</CustomText>
                    </View>
                  );
                })}
              </View>
            </View>
          )}
          {error && <CustomText variant="caption" color={colors.error}>{error}</CustomText>}
          <PrimaryButton label={create ? 'Create account' : 'Sign in'} disabled={!canSubmit} busy={busy} onPress={submit} />
          {!create && (
            <TouchableOpacity onPress={() => navigation.navigate('ForgotPasswordScreen', { email })} style={{ alignSelf: 'center' }} hitSlop={8}>
              <CustomText variant="label" color={colors.accent}>Forgot password?</CustomText>
            </TouchableOpacity>
          )}
          <View style={{ flexDirection: 'row', justifyContent: 'center', gap: spacing.xs, marginTop: spacing.md }}>
            <CustomText variant="caption" color={colors.inkMuted}>{create ? 'Already have an account?' : 'New here?'}</CustomText>
            <CustomText variant="caption" color={colors.accent} onPress={switchMode}>{create ? 'Sign in' : 'Create an account'}</CustomText>
          </View>
          {create && (
            <CustomText variant="caption" color={colors.inkMuted} centered>By creating an account you agree to the Terms of Use and Privacy Policy.</CustomText>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};
