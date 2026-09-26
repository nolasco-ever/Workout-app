import React, { useCallback, useState } from 'react';
import { TouchableOpacity, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getPermission, PermissionState, requestPermission } from '../../data/notifications/notificationService';
import { useAuth } from '../../data/auth/AuthProvider';
import { CustomText } from '../text/customText';
import { SurfaceCard } from './SurfaceCard';
import { PrimaryButton } from '../buttons/PrimaryButton';
import { Icon } from '../icons/Icon';
import { generalIcons } from '../icons/icon-library';
import { useTheme } from '../../theme';

// "Not now" hides the card until the next launch; the settings screen always offers it.
let dismissedThisLaunch = false;

/**
 * Asks for the OS notification permission from a place where the value is
 * obvious: the Workout tab, once a plan is active. Renders nothing once the
 * user has answered the system prompt either way.
 */
export const NotificationPermissionCard = () => {
  const { colors, spacing } = useTheme();
  const { uid, profile } = useAuth();
  const prompted = !!profile?.notificationsPromptedAt;
  const [permission, setPermission] = useState<PermissionState | null>(null);
  const [dismissed, setDismissed] = useState(dismissedThisLaunch);

  useFocusEffect(
    useCallback(() => {
      getPermission(prompted).then(setPermission).catch(() => undefined);
    }, [prompted]),
  );

  if (permission !== 'undetermined' || dismissed) return null;

  const dismiss = () => {
    dismissedThisLaunch = true;
    setDismissed(true);
  };

  return (
    <SurfaceCard>
      <View style={{ flexDirection: 'row', gap: spacing.md, alignItems: 'flex-start' }}>
        <Icon icon={generalIcons.bell} size={22} color={colors.accent} />
        <View style={{ flex: 1, gap: spacing.xs }}>
          <CustomText variant="bodyStrong">Get reminded on workout days</CustomText>
          <CustomText variant="caption" color={colors.inkMuted}>A nudge in the morning, and a buzz when your rest is over. Only while a workout is still waiting.</CustomText>
        </View>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginTop: spacing.md }}>
        <View style={{ flex: 1 }}>
          <PrimaryButton label="Turn on" onPress={() => requestPermission(uid).then(setPermission).catch(() => undefined)} />
        </View>
        <TouchableOpacity onPress={dismiss} hitSlop={10} accessibilityRole="button" style={{ paddingHorizontal: spacing.sm }}>
          <CustomText variant="label" color={colors.inkMuted}>Not now</CustomText>
        </TouchableOpacity>
      </View>
    </SurfaceCard>
  );
};
