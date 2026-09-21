import React from 'react';
import { View } from 'react-native';
import { PrimaryButton } from '../../../components/buttons/PrimaryButton';
import { CustomText } from '../../../components/text/customText';
import { useTheme } from '../../../theme';

/** Bottom bar for creator steps: an optional problem line and the Next button. */
export const StepFooter = ({ label, onPress, problem, busy }: { label: string; onPress: () => void; problem?: string | null; busy?: boolean }) => {
  const { colors, spacing } = useTheme();
  return (
    <View style={{ padding: spacing.lg, gap: spacing.sm, borderTopWidth: 1, borderTopColor: colors.line, backgroundColor: colors.ground }}>
      {problem && <CustomText variant="caption" color={colors.error} centered>{problem}</CustomText>}
      <PrimaryButton label={label} onPress={onPress} disabled={!!problem} busy={busy} />
    </View>
  );
};
