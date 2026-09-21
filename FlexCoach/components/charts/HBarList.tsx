import React from 'react';
import { View } from 'react-native';
import { CustomText } from '../text/customText';
import { useTheme } from '../../theme';

export interface HBar {
  label: string;
  value: number;
  valueLabel: string;
}

/** Horizontal magnitude bars with the label on the left and the value on the right. */
export const HBarList = ({ bars, max }: { bars: HBar[]; max?: number }) => {
  const { colors, spacing, radius } = useTheme();
  const top = max ?? Math.max(1, ...bars.map(b => b.value));
  return (
    <View style={{ gap: spacing.sm }}>
      {bars.map(b => (
        <View key={b.label} style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
          <View style={{ width: 92 }}>
            <CustomText variant="caption" numberOfLines={1}>{b.label}</CustomText>
          </View>
          <View style={{ flex: 1, height: 10, borderRadius: radius.sm, backgroundColor: colors.surfaceRaised, overflow: 'hidden' }}>
            <View style={{ width: `${Math.max(2, (b.value / top) * 100)}%`, height: 10, borderRadius: radius.sm, backgroundColor: colors.accent, opacity: 0.35 + 0.65 * (b.value / top) }} />
          </View>
          <View style={{ width: 64, alignItems: 'flex-end' }}>
            <CustomText variant="caption" color={colors.inkMuted}>{b.valueLabel}</CustomText>
          </View>
        </View>
      ))}
    </View>
  );
};
