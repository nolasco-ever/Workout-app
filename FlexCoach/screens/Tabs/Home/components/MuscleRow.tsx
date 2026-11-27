import React from 'react';
import { TouchableOpacity, View } from 'react-native';
import { CustomText } from '../../../../components/text/customText';
import { Icon } from '../../../../components/icons/Icon';
import { directionIcons } from '../../../../components/icons/icon-library';
import { useTheme } from '../../../../theme';

const title = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/**
 * One muscle and its sets. A bar scaled to `max` only where `max` is given
 * (the All muscles list); the cards leave it out (owner, 2026-11-27). With
 * `onPress` the row opens the muscle's detail and shows a chevron.
 */
export const MuscleRow = ({ muscle, sets, max, onPress }: { muscle: string; sets: number; max?: number; onPress?: () => void }) => {
  const { colors, spacing } = useTheme();
  const label = `${sets} set${sets === 1 ? '' : 's'}`;
  const content = (
    <>
      <View style={{ flex: max === undefined ? 1 : undefined, width: max === undefined ? undefined : 92 }}>
        <CustomText variant="bodyStrong" numberOfLines={1}>{title(muscle)}</CustomText>
      </View>
      {max !== undefined && (
        <View style={{ flex: 1, height: 8, borderRadius: 4, backgroundColor: colors.surfaceRaised, overflow: 'hidden' }}>
          <View style={{ width: `${Math.max(3, (sets / max) * 100)}%`, height: 8, backgroundColor: colors.data, opacity: 0.4 + 0.6 * (sets / max) }} />
        </View>
      )}
      <View style={{ minWidth: 52, alignItems: 'flex-end' }}>
        <CustomText variant="caption" color={colors.inkMuted}>{label}</CustomText>
      </View>
      {onPress && <Icon icon={directionIcons.angleRight} size={18} color={colors.inactive} />}
    </>
  );
  const style = { flexDirection: 'row' as const, alignItems: 'center' as const, gap: spacing.md, paddingVertical: spacing.md };
  return onPress ? (
    <TouchableOpacity onPress={onPress} accessibilityRole="button" accessibilityLabel={`${title(muscle)}, ${label}`} style={style}>{content}</TouchableOpacity>
  ) : (
    <View accessible accessibilityLabel={`${title(muscle)}, ${label}`} style={style}>{content}</View>
  );
};
