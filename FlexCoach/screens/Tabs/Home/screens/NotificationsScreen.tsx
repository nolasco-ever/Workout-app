import React from 'react';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CustomText } from '../../../../components/text/customText';
import { Icon } from '../../../../components/icons/Icon';
import { generalIcons } from '../../../../components/icons/icon-library';
import { useTheme } from '../../../../theme';

/**
 * There is no notification source yet (workout reminders and buddy activity
 * come later), so the screen is an honest empty state rather than samples.
 */
export const NotificationsScreen = () => {
  const { colors, spacing } = useTheme();
  return (
    <SafeAreaView edges={['bottom', 'left', 'right']} style={{ flex: 1, backgroundColor: colors.ground }}>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl, gap: spacing.md }}>
        <View style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: colors.surfaceRaised, alignItems: 'center', justifyContent: 'center' }}>
          <Icon icon={generalIcons.bell} color={colors.inkMuted} size={32} />
        </View>
        <CustomText variant="heading" centered>All caught up</CustomText>
        <CustomText variant="body" color={colors.inkMuted} centered>
          No notifications right now. Workout reminders and buddy activity will show up here.
        </CustomText>
      </View>
    </SafeAreaView>
  );
};
