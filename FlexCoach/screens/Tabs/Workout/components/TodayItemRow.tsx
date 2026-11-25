import React from 'react';
import { TouchableOpacity, View } from 'react-native';
import { ExerciseKind, OccurrenceStatus } from '../../../../data/models';
import { CustomText } from '../../../../components/text/customText';
import { Icon } from '../../../../components/icons/Icon';
import { directionIcons, generalIcons } from '../../../../components/icons/icon-library';
import { useTheme } from '../../../../theme';

const kindIcon = (kind: ExerciseKind) => (kind === 'cardio' ? generalIcons.cardio : kind === 'stretching' ? generalIcons.stretching : generalIcons.dumbbell);

/**
 * One of today's items on the Workout tab (v1 #10.5): its place in the day
 * (a check once done), the name with its kind, a line under it, and a
 * chevron. The whole row opens the item; Start lives on the preview. A
 * quick workout done today sits here like a planned one (build 22
 * feedback), its line saying it wasn't in the plan.
 */
export const TodayItemRow = ({ name, kind, status, unplanned = false, index, count, summary, first, onOpen }: {
  name: string;
  kind: ExerciseKind;
  status: OccurrenceStatus;
  unplanned?: boolean;
  index: number;
  count: number;
  summary: string;
  first: boolean;
  onOpen: () => void;
}) => {
  const { colors, spacing } = useTheme();
  const done = status === 'completed';
  const skipped = status === 'skipped';
  const line = done ? (unplanned ? 'Done · not in your plan' : 'Done') : skipped ? 'Skipped' : summary;
  return (
    <TouchableOpacity
      onPress={onOpen}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={`Item ${index + 1} of ${count}, ${name}, ${kind}, ${line}`}
      style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, minHeight: 60, paddingVertical: spacing.sm, borderTopWidth: first ? 0 : 1, borderTopColor: colors.line }}
    >
      <View
        style={{
          width: 28,
          height: 28,
          borderRadius: 14,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: done ? colors.success : colors.surfaceRaised,
        }}
      >
        {done ? (
          <Icon icon={generalIcons.check} size={16} color={colors.ground} strokeWidth={3} />
        ) : (
          <CustomText variant="label" color={skipped ? colors.inkMuted : colors.ink}>{index + 1}</CustomText>
        )}
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
          <CustomText variant="bodyStrong" color={done || skipped ? colors.inkMuted : colors.ink} style={{ flexShrink: 1 }}>
            {name}
          </CustomText>
          <Icon icon={kindIcon(kind)} size={14} color={colors.inkMuted} />
        </View>
        <CustomText variant="caption" color={done ? colors.success : colors.inkMuted}>{line}</CustomText>
      </View>
      <Icon icon={directionIcons.angleRight} size={18} color={colors.inkMuted} />
    </TouchableOpacity>
  );
};
