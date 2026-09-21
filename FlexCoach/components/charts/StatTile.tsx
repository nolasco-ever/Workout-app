import React from 'react';
import { View } from 'react-native';
import { CustomText } from '../text/customText';
import { useTheme } from '../../theme';

interface Props {
  label: string;
  value: string;
  /** Small line under the value, e.g. "+4% vs last week". */
  delta?: string | null;
  tone?: 'up' | 'down' | 'neutral';
}

export const StatTile = ({ label, value, delta, tone = 'neutral' }: Props) => {
  const { colors, spacing, radius } = useTheme();
  const deltaColor = tone === 'up' ? colors.success : tone === 'down' ? colors.error : colors.inkMuted;
  return (
    <View style={{ flex: 1, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, borderRadius: radius.lg, padding: spacing.md, gap: 2 }}>
      <CustomText variant="overline" color={colors.inkMuted}>{label}</CustomText>
      <CustomText variant="title" style={{ fontVariant: ['tabular-nums'] }}>{value}</CustomText>
      {delta ? <CustomText variant="caption" color={deltaColor}>{delta}</CustomText> : null}
    </View>
  );
};
