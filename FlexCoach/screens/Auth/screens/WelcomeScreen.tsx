import React, { useState } from 'react';
import { Alert, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { appleAuth } from '@invertase/react-native-apple-authentication';
import { authService, AuthError } from '../../../data/auth/authService';
import { features } from '../../../config/features';
import { CustomText } from '../../../components/text/customText';
import { Icon } from '../../../components/icons/Icon';
import { generalIcons } from '../../../components/icons/icon-library';
import { useTheme } from '../../../theme';
import { AuthStackParams } from '../AuthStack';
import { ProviderButton } from '../components/ProviderButton';

export const WelcomeScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<AuthStackParams>>();
  const { colors, spacing, radius } = useTheme();
  const [busy, setBusy] = useState<'apple' | 'google' | null>(null);
  const showApple = features.appleSignIn && appleAuth.isSupported;

  const run = (kind: 'apple' | 'google', fn: () => Promise<void>) => async () => {
    setBusy(kind);
    try {
      await fn();
    } catch (err) {
      if (err instanceof AuthError && err.code === 'auth/user-cancelled') return;
      Alert.alert("Couldn't sign in", err instanceof Error ? err.message : 'Try again.');
    } finally {
      setBusy(null);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.ground }}>
      <View style={{ flex: 1, padding: spacing.xl, justifyContent: 'space-between' }}>
        <View style={{ flex: 1, justifyContent: 'center', gap: spacing.lg }}>
          <View style={{ width: 72, height: 72, borderRadius: radius.lg, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' }}>
            <Icon icon={generalIcons.dumbbell} color={colors.onAccent} size={36} strokeWidth={2.5} />
          </View>
          <View style={{ gap: spacing.sm }}>
            <CustomText variant="display">FlexCoach</CustomText>
            <CustomText variant="body" color={colors.inkMuted}>
              Build your plan, log every set, and watch the numbers climb. Your progress lives in your account, so it follows you to any phone.
            </CustomText>
          </View>
        </View>
        <View style={{ gap: spacing.sm }}>
          {showApple && <ProviderButton provider="apple" label="Continue with Apple" busy={busy === 'apple'} onPress={run('apple', authService.signInWithApple)} />}
          <ProviderButton provider="google" label="Continue with Google" busy={busy === 'google'} onPress={run('google', authService.signInWithGoogle)} />
          <ProviderButton provider="email" label="Continue with email" onPress={() => navigation.navigate('EmailAuthScreen', { mode: 'create' })} />
          <View style={{ flexDirection: 'row', justifyContent: 'center', gap: spacing.xs, marginTop: spacing.sm }}>
            <CustomText variant="caption" color={colors.inkMuted}>Already have an account?</CustomText>
            <CustomText variant="caption" color={colors.accent} onPress={() => navigation.navigate('EmailAuthScreen', { mode: 'signin' })}>Sign in</CustomText>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
};
