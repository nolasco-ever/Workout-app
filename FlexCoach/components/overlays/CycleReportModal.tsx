import React from 'react';
import { Modal, Pressable, View } from 'react-native';
import { CustomText } from '../text/customText';
import { Icon } from '../icons/Icon';
import { generalIcons } from '../icons/icon-library';
import { PrimaryButton } from '../buttons/PrimaryButton';
import { useTheme } from '../../theme';

interface Props {
  open: boolean;
  cycleNumber: number;
  onReview: () => void;
  onLater: () => void;
}

/**
 * A centred dialog, not a sheet: the cycle report is ready. Shown once per
 * cycle, the first time the app opens after the report lands. Review opens
 * it; Later leaves the Home card to do the reminding.
 */
export const CycleReportModal = ({ open, cycleNumber, onReview, onLater }: Props) => {
  const { colors, spacing, radius } = useTheme();
  return (
    <Modal visible={open} transparent animationType="fade" onRequestClose={onLater} statusBarTranslucent>
      <Pressable onPress={onLater} accessibilityRole="button" accessibilityLabel="Later" style={{ flex: 1, backgroundColor: colors.scrim, alignItems: 'center', justifyContent: 'center', padding: spacing.xl }}>
        {/* The card itself swallows taps so only the scrim dismisses. */}
        <Pressable onPress={() => undefined} style={{ width: '100%', maxWidth: 360, backgroundColor: colors.surface, borderRadius: radius.xl, borderWidth: 1, borderColor: colors.line, padding: spacing.xl, alignItems: 'center', gap: spacing.md }}>
          <View style={{ width: 88, height: 88, borderRadius: 44, backgroundColor: colors.accentTint, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.xs }}>
            <Icon icon={generalIcons.trophy} size={44} color={colors.accent} strokeWidth={1.75} />
          </View>
          <CustomText variant="overline" color={colors.accent}>Cycle {cycleNumber}</CustomText>
          <CustomText variant="title" centered>Your cycle report is ready</CustomText>
          <CustomText variant="body" color={colors.inkMuted} centered>
            Review your report to see your stats and any changes to your next cycle
          </CustomText>
          <View style={{ alignSelf: 'stretch', gap: spacing.sm, marginTop: spacing.sm }}>
            <PrimaryButton label="Review" onPress={onReview} />
            <PrimaryButton label="Later" variant="quiet" onPress={onLater} />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
};
