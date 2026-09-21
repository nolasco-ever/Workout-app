import React, { useState } from 'react';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../../data/auth/AuthProvider';
import { completeOnboarding } from '../../../data/services/profileService';
import { CustomText } from '../../../components/text/customText';
import { PrimaryButton } from '../../../components/buttons/PrimaryButton';
import { SurfaceCard } from '../../../components/cards/SurfaceCard';
import { Icon } from '../../../components/icons/Icon';
import { generalIcons } from '../../../components/icons/icon-library';
import { useTheme } from '../../../theme';

/**
 * Last step. Finishing marks onboarding complete, which swaps the app to the
 * tabs; the Workout tab's empty state then leads into the plan creator.
 */
export const FirstPlanScreen = () => {
  const { colors, spacing } = useTheme();
  const { uid } = useAuth();
  const [busy, setBusy] = useState(false);

  const finish = async () => {
    if (!uid) return;
    setBusy(true);
    try {
      await completeOnboarding(uid);
    } finally {
      setBusy(false);
    }
  };

  const steps = [
    { icon: generalIcons.dumbbell, title: 'Build a plan', text: 'Your splits, exercises, and a rotation or weekly schedule.' },
    { icon: generalIcons.play, title: 'Train', text: 'The Workout tab shows what to do today and logs every set.' },
    { icon: generalIcons.simpleChart, title: 'Watch it climb', text: 'Home turns your sessions into trends, records, and muscle coverage.' },
  ];

  return (
    <SafeAreaView edges={['bottom', 'left', 'right']} style={{ flex: 1, backgroundColor: colors.ground }}>
      <View style={{ flex: 1, padding: spacing.lg, gap: spacing.lg, justifyContent: 'center' }}>
        <CustomText variant="title">You're set. Here's how it works.</CustomText>
        <SurfaceCard style={{ gap: spacing.lg }}>
          {steps.map(s => (
            <View key={s.title} style={{ flexDirection: 'row', gap: spacing.md, alignItems: 'flex-start' }}>
              <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: colors.accentTint, alignItems: 'center', justifyContent: 'center' }}>
                <Icon icon={s.icon} size={20} color={colors.accent} />
              </View>
              <View style={{ flex: 1 }}>
                <CustomText variant="bodyStrong">{s.title}</CustomText>
                <CustomText variant="caption" color={colors.inkMuted}>{s.text}</CustomText>
              </View>
            </View>
          ))}
        </SurfaceCard>
      </View>
      <View style={{ padding: spacing.lg, borderTopWidth: 1, borderTopColor: colors.line }}>
        <PrimaryButton label="Build my first plan" busy={busy} onPress={finish} />
      </View>
    </SafeAreaView>
  );
};
