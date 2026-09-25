import React, { useState } from 'react';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { requestPermission } from '../../../data/notifications/notificationService';
import { CustomText } from '../../../components/text/customText';
import { PrimaryButton } from '../../../components/buttons/PrimaryButton';
import { SurfaceCard } from '../../../components/cards/SurfaceCard';
import { Icon } from '../../../components/icons/Icon';
import { generalIcons } from '../../../components/icons/icon-library';
import { useTheme } from '../../../theme';
import { OnboardingStackParams } from '../OnboardingStack';

/**
 * Asks for the OS notification permission once, before the first plan. The
 * result is final either way, so the later in-app prompts (the Workout tab's
 * card and the auto-prompt on plan activation) never show again after this.
 * Skipping leaves the permission undetermined and those prompts intact.
 */
export const NotificationsOnboardingScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<OnboardingStackParams>>();
  const { colors, spacing } = useTheme();
  const [busy, setBusy] = useState(false);

  const next = () => navigation.navigate('FirstPlanScreen');

  const turnOn = async () => {
    setBusy(true);
    try {
      await requestPermission();
    } catch {
      // The OS prompt failing shouldn't block onboarding.
    } finally {
      setBusy(false);
      next();
    }
  };

  const perks = [
    { icon: generalIcons.bell, title: 'Workout-day reminders', text: 'A morning nudge, and an evening one if the session is still waiting.' },
    { icon: generalIcons.timer, title: 'Rest timer', text: 'A buzz when your rest is over, even with the phone in your pocket.' },
    { icon: generalIcons.flame, title: 'Keep the streak', text: 'A heads-up before a missed day breaks it.' },
  ];

  return (
    <SafeAreaView edges={['bottom', 'left', 'right']} style={{ flex: 1, backgroundColor: colors.ground }}>
      <View style={{ flex: 1, padding: spacing.lg, gap: spacing.lg, justifyContent: 'center' }}>
        <View style={{ alignItems: 'center', gap: spacing.md }}>
          <View style={{ width: 96, height: 96, borderRadius: 48, backgroundColor: colors.accentTint, alignItems: 'center', justifyContent: 'center' }}>
            <Icon icon={generalIcons.bell} size={44} color={colors.accent} />
          </View>
          <CustomText variant="title" centered>Stay on track</CustomText>
          <CustomText variant="body" color={colors.inkMuted} centered>Only on days you planned to train. You can change any of these later in Profile.</CustomText>
        </View>
        <SurfaceCard style={{ gap: spacing.lg }}>
          {perks.map(p => (
            <View key={p.title} style={{ flexDirection: 'row', gap: spacing.md, alignItems: 'flex-start' }}>
              <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: colors.accentTint, alignItems: 'center', justifyContent: 'center' }}>
                <Icon icon={p.icon} size={20} color={colors.accent} />
              </View>
              <View style={{ flex: 1 }}>
                <CustomText variant="bodyStrong">{p.title}</CustomText>
                <CustomText variant="caption" color={colors.inkMuted}>{p.text}</CustomText>
              </View>
            </View>
          ))}
        </SurfaceCard>
      </View>
      <View style={{ padding: spacing.lg, gap: spacing.sm, borderTopWidth: 1, borderTopColor: colors.line }}>
        <PrimaryButton label="Turn on notifications" busy={busy} onPress={turnOn} />
        <PrimaryButton label="Not now" variant="quiet" disabled={busy} onPress={next} />
      </View>
    </SafeAreaView>
  );
};
