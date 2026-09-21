import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { authService } from '../../../data/auth/authService';
import { CustomText } from '../../../components/text/customText';
import { TextField } from '../../../components/inputs/TextField';
import { PrimaryButton } from '../../../components/buttons/PrimaryButton';
import { Icon } from '../../../components/icons/Icon';
import { generalIcons } from '../../../components/icons/icon-library';
import { useTheme } from '../../../theme';
import { AuthStackParams } from '../AuthStack';

export const ForgotPasswordScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<AuthStackParams>>();
  const { params } = useRoute<RouteProp<AuthStackParams, 'ForgotPasswordScreen'>>();
  const { colors, spacing } = useTheme();
  const [email, setEmail] = useState(params.email ?? '');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const send = async () => {
    setBusy(true);
    setError(null);
    try {
      await authService.sendPasswordReset(email);
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView edges={['bottom', 'left', 'right']} style={{ flex: 1, backgroundColor: colors.ground }}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }} keyboardVerticalOffset={100}>
        <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.lg }} keyboardShouldPersistTaps="handled">
          {sent ? (
            <View style={{ alignItems: 'center', gap: spacing.md, paddingVertical: spacing.xl }}>
              <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: colors.successTint, alignItems: 'center', justifyContent: 'center' }}>
                <Icon icon={generalIcons.envelope} color={colors.success} size={28} />
              </View>
              <CustomText variant="title" centered>Check your inbox</CustomText>
              <CustomText variant="body" color={colors.inkMuted} centered>We sent a reset link to {email.trim()}. Open it to choose a new password, then come back and sign in.</CustomText>
              <PrimaryButton label="Back to sign in" onPress={() => navigation.goBack()} />
            </View>
          ) : (
            <>
              <CustomText variant="body" color={colors.inkMuted}>Enter the email for your account and we'll send a link to reset the password.</CustomText>
              <TextField id="reset-email" label="Email" value={email} onChangeText={setEmail} autoCapitalize="none" autoCorrect={false} keyboardType="email-address" autoComplete="email" textContentType="emailAddress" autoFocus returnKeyType="send" onSubmitEditing={send} />
              {error && <CustomText variant="caption" color={colors.error}>{error}</CustomText>}
              <PrimaryButton label="Send reset link" disabled={!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())} busy={busy} onPress={send} />
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};
