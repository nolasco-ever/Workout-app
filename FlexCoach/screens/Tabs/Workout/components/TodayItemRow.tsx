import React from 'react';
import { TouchableOpacity, View } from 'react-native';
import { Occurrence, Workout } from '../../../../data/models';
import { isCardioItem } from '../../../../data/engine/planItems';
import { CustomText } from '../../../../components/text/customText';
import { Icon } from '../../../../components/icons/Icon';
import { directionIcons, generalIcons } from '../../../../components/icons/icon-library';
import { useTheme } from '../../../../theme';

const kindIcon = (w: Workout) => (isCardioItem(w) ? generalIcons.cardio : w.type === 'stretching' ? generalIcons.stretching : generalIcons.dumbbell);
const kindName = (w: Workout) => (isCardioItem(w) ? 'cardio' : w.type === 'stretching' ? 'stretching' : 'strength');

/**
 * One of today's items on the Workout tab (v1 #10.5): its place in the day
 * (a check once done), the name with its kind, a line under it, and a
 * chevron. The whole row opens the item; Start lives on the preview.
 */
export const TodayItemRow = ({ occurrence, workout, index, count, summary, first, onOpen }: {
  occurrence: Occurrence;
  workout: Workout;
  index: number;
  count: number;
  summary: string;
  first: boolean;
  onOpen: () => void;
}) => {
  const { colors, spacing } = useTheme();
  const done = occurrence.status === 'completed';
  const skipped = occurrence.status === 'skipped';
  const line = done ? 'Done' : skipped ? 'Skipped' : summary;
  return (
    <TouchableOpacity
      onPress={onOpen}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={`Item ${index + 1} of ${count}, ${workout.name}, ${kindName(workout)}, ${line}`}
      style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, minHeight: 60, paddingVertical: spacing.sm, borderTopWidth: first ? 0 : 1, borderTopColor: colors.line }}
    >
      <View
        style={{
          width: 28,
          height: 28,
          borderRadius: 14,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: done ? colors.success : skipped ? colors.surfaceRaised : colors.accentTint,
        }}
      >
        {done ? (
          <Icon icon={generalIcons.check} size={16} color={colors.ground} strokeWidth={3} />
        ) : (
          <CustomText variant="label" color={skipped ? colors.inkMuted : colors.accent}>{index + 1}</CustomText>
        )}
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
          <CustomText variant="bodyStrong" color={done || skipped ? colors.inkMuted : colors.ink} style={{ flexShrink: 1 }}>
            {workout.name}
          </CustomText>
          <Icon icon={kindIcon(workout)} size={14} color={colors.inkMuted} />
        </View>
        <CustomText variant="caption" color={done ? colors.success : colors.inkMuted}>{line}</CustomText>
      </View>
      <Icon icon={directionIcons.angleRight} size={18} color={colors.inkMuted} />
    </TouchableOpacity>
  );
};
