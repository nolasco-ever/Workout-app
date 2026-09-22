import React, { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../../../data/auth/AuthProvider';
import { authService, passwordOk } from '../../../../data/auth/authService';
import { CustomText } from '../../../../components/text/customText';
import { SurfaceCard } from '../../../../components/cards/SurfaceCard';
import { Row } from '../../../../components/list-items/Row';
import { TextField } from '../../../../components/inputs/TextField';
import { PrimaryButton } from '../../../../components/buttons/PrimaryButton';
import { useTheme } from '../../../../theme';

const providerLabel = { password: 'Email and password', google: 'Google', apple: 'Apple' } as const;

export const AccountScreen = () => {
  const { colors, spacing } = useTheme();
  const { user, profile } = useAuth();
  const provider = profile?.authProvider ?? 'password';
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<{ tone: 'ok' | 'error'; text: string } | null>(null);

  const changePassword = async () => {
    setBusy('password');
    setMessage(null);
    try {
      await authService.changePassword(current, next);
      setCurrent('');
      setNext('');
      setMessage({ tone: 'ok', text: 'Password updated.' });
    } catch (err) {
      setMessage({ tone: 'error', text: err instanceof Error ? err.message : 'Something went wrong.' });
    } finally {
      setBusy(null);
    }
  };

  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Alert.prompt is iOS-only, so the password check lives inline and works on both platforms.
  const deleteAccount = () =>
    Alert.alert('Delete your account?', 'Your plans, sessions, weigh-ins, and profile are erased. This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete everything',
        style: 'destructive',
        onPress: async () => {
          setBusy('delete');
          setDeleteError(null);
          try {
            await authService.deleteAccount(provider === 'password' ? deletePassword : undefined);
          } catch (err) {
            setDeleteError(err instanceof Error ? err.message : 'Try again.');
          } finally {
            setBusy(null);
          }
        },
      },
    ]);

  return (
    <SafeAreaView edges={['bottom', 'left', 'right']} style={{ flex: 1, backgroundColor: colors.ground }}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }} keyboardVerticalOffset={100}>
        <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.lg }} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag">
          <SurfaceCard style={{ padding: 0 }}>
            <Row title="Signed in with" right={providerLabel[provider]} chevron={false} />
            <Row title="Email" right={user?.email ?? '—'} chevron={false} divider />
          </SurfaceCard>

          {provider === 'password' && (
            <SurfaceCard style={{ gap: spacing.md }}>
              <CustomText variant="heading">Change password</CustomText>
              <TextField id="pw-current" label="Current password" value={current} onChangeText={setCurrent} secureTextEntry autoCapitalize="none" textContentType="password" />
              <TextField id="pw-next" label="New password" value={next} onChangeText={setNext} secureTextEntry autoCapitalize="none" textContentType="newPassword" hint="At least 8 characters with a letter and a number." />
              {message && <CustomText variant="caption" color={message.tone === 'ok' ? colors.success : colors.error}>{message.text}</CustomText>}
              <PrimaryButton label="Update password" variant="outline" disabled={current.length === 0 || !passwordOk(next)} busy={busy === 'password'} onPress={changePassword} />
            </SurfaceCard>
          )}

          <View style={{ gap: spacing.sm }}>
            <CustomText variant="overline" color={colors.inkMuted}>Danger zone</CustomText>
            <SurfaceCard style={{ padding: 0 }}>
              <Row title="Delete account" description="Erases your data permanently." tone="destructive" chevron={false} onPress={busy ? undefined : () => (provider === 'password' ? setConfirmingDelete(v => !v) : deleteAccount())} />
              {confirmingDelete && provider === 'password' && (
                <View style={{ padding: spacing.lg, paddingTop: 0, gap: spacing.md }}>
                  <TextField id="pw-delete" label="Confirm your password" value={deletePassword} onChangeText={setDeletePassword} secureTextEntry autoCapitalize="none" textContentType="password" error={deleteError} hint="For safety, enter your password to delete the account." />
                  <PrimaryButton label="Delete everything" variant="outline" tone="destructive" disabled={deletePassword.length === 0} busy={busy === 'delete'} onPress={deleteAccount} />
                </View>
              )}
            </SurfaceCard>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};
