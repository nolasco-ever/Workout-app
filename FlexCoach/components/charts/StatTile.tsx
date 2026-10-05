import React from 'react';
import { TouchableOpacity, View } from 'react-native';
import { CustomText } from '../text/customText';
import { useTheme } from '../../theme';

interface Props {
  label: string;
  value: string;
  /** Small line under the value, e.g. "+4% vs last week". */
  delta?: string | null;
  tone?: 'up' | 'down' | 'neutral';
  /** With a handler the tile is a button, e.g. to explain what the number means. */
  onPress?: () => void;
  accessibilityLabel?: string;
}

export const StatTile = ({ label, value, delta, tone = 'neutral', onPress, accessibilityLabel }: Props) => {
  const { colors, spacing, radius } = useTheme();
  const deltaColor = tone === 'up' ? colors.success : tone === 'down' ? colors.error : colors.inkMuted;
  const body = (
    <>
      <CustomText variant="overline" color={colors.inkMuted}>{label}</CustomText>
      <CustomText variant="title" style={{ fontVariant: ['tabular-nums'] }}>{value}</CustomText>
      {delta ? <CustomText variant="caption" color={deltaColor}>{delta}</CustomText> : null}
    </>
  );
  const style = { flex: 1, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, borderRadius: radius.lg, padding: spacing.md, gap: 2 } as const;
  return onPress ? (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7} accessibilityRole="button" accessibilityLabel={accessibilityLabel ?? `${label} ${value}`} style={style}>
      {body}
    </TouchableOpacity>
  ) : (
    <View style={style}>{body}</View>
  );
};
