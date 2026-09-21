import React from 'react';
import { TouchableOpacity, View } from 'react-native';
import { CustomText } from '../../../../components/text/customText';
import { Icon } from '../../../../components/icons/Icon';
import { directionIcons } from '../../../../components/icons/icon-library';
import { useTheme } from '../../../../theme';

const title = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** One muscle with a bar scaled to `max`, opening its detail on tap. */
export const MuscleRow = ({ muscle, sets, max, onPress }: { muscle: string; sets: number; max: number; onPress: () => void }) => {
  const { colors, spacing } = useTheme();
  return (
    <TouchableOpacity onPress={onPress} style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.md }}>
      <View style={{ width: 92 }}>
        <CustomText variant="bodyStrong" numberOfLines={1}>{title(muscle)}</CustomText>
      </View>
      <View style={{ flex: 1, height: 8, borderRadius: 4, backgroundColor: colors.surfaceRaised, overflow: 'hidden' }}>
        <View style={{ width: `${Math.max(3, (sets / max) * 100)}%`, height: 8, backgroundColor: colors.accent, opacity: 0.4 + 0.6 * (sets / max) }} />
      </View>
      <View style={{ width: 52, alignItems: 'flex-end' }}>
        <CustomText variant="caption" color={colors.inkMuted}>{sets} set{sets === 1 ? '' : 's'}</CustomText>
      </View>
      <Icon icon={directionIcons.angleRight} size={18} color={colors.inactive} />
    </TouchableOpacity>
  );
};
