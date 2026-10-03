import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { useAuth } from '../../data/auth/AuthProvider';
import { useBuddies } from '../../data/hooks/useBuddies';
import { userRepository } from '../../data/repositories/userRepository';
import { navigationRef } from '../../navigation/navigationRef';
import { BottomSheet } from '../overlays/BottomSheet';
import { PrimaryButton } from '../buttons/PrimaryButton';
import { CustomText } from '../text/customText';
import { Icon } from '../icons/Icon';
import { generalIcons } from '../icons/icon-library';
import { useTheme } from '../../theme';

/**
 * Shown once, the first time the account has a buddy (right after adding
 * one, or on first launch for accounts that already had buddies before
 * sharing settings existed): what buddies get to see, with a way to the
 * settings. Mount once at the app root for signed-in accounts.
 */
export const SharingPrompt = () => {
  const { colors, spacing } = useTheme();
  const { uid, profile } = useAuth();
  const { buddies, loading } = useBuddies();
  const [open, setOpen] = useState(false);
  const due = !!uid && !!profile && !profile.sharingPromptSeenAt && !loading && buddies.length > 0;

  useEffect(() => {
    if (due) setOpen(true);
  }, [due]);

  const dismiss = (then?: () => void) => {
    setOpen(false);
    if (uid) userRepository.update(uid, { sharingPromptSeenAt: Date.now() }).catch(err => console.warn('sharing prompt flag failed', err));
    then?.();
  };
  const review = () =>
    dismiss(() => {
      if (!navigationRef.isReady()) return;
      (navigationRef as any).navigate('TabNavigator', { screen: 'ProfileStack', params: { screen: 'SharingScreen', initial: false } });
    });

  const lines: { icon: typeof generalIcons.check; text: string }[] = [
    { icon: generalIcons.check, text: 'Finished workouts, with the exercises, sets, reps and weight' },
    { icon: generalIcons.trophy, text: 'New records, with a graph of that exercise over time' },
    { icon: generalIcons.dumbbell, text: 'Sets and weight moved, on the feed and your Iron Card' },
    { icon: generalIcons.calendarDay, text: 'Skipped and moved workouts' },
  ];

  return (
    <BottomSheet
      open={open}
      title="What buddies see"
      onClose={() => dismiss()}
      footer={
        <View style={{ gap: spacing.sm }}>
          <PrimaryButton label="Choose what to share" onPress={review} />
          <PrimaryButton label="Keep everything on" variant="outline" onPress={() => dismiss()} />
        </View>
      }
    >
      <View style={{ gap: spacing.lg }}>
        <CustomText variant="body" color={colors.inkMuted}>
          Buddies see a summary of your training. All of it is on to begin with, and you can turn any of it off in Profile at any time.
        </CustomText>
        <View style={{ gap: spacing.md }}>
          {lines.map(l => (
            <View key={l.text} style={{ flexDirection: 'row', gap: spacing.md, alignItems: 'center' }}>
              <Icon icon={l.icon} size={18} color={colors.accent} />
              <CustomText variant="body" style={{ flex: 1 }}>{l.text}</CustomText>
            </View>
          ))}
        </View>
      </View>
    </BottomSheet>
  );
};
