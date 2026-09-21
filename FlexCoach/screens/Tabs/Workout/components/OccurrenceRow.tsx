import React from 'react';
import { TouchableOpacity, View } from 'react-native';
import { Occurrence } from '../../../../data/models';
import { fromLocalDate } from '../../../../data/engine/dates';
import { CustomText } from '../../../../components/text/customText';
import { useTheme } from '../../../../theme';
import { StatusPill } from './StatusPill';

const DAY = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

export const OccurrenceRow = ({ occurrence, isToday, onPress }: { occurrence: Occurrence; isToday: boolean; onPress?: () => void }) => {
  const { colors, spacing } = useTheme();
  const d = fromLocalDate(occurrence.date);
  const disabled = !onPress || occurrence.status === 'rest';
  return (
    <TouchableOpacity
      disabled={disabled}
      onPress={onPress}
      style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.md, paddingHorizontal: spacing.lg }}
    >
      <View style={{ width: 44 }}>
        <CustomText variant="overline" color={isToday ? colors.accent : colors.inkMuted}>
          {DAY[d.getDay()]}
        </CustomText>
        <CustomText variant="bodyStrong" color={isToday ? colors.accent : colors.ink}>
          {d.getDate()}
        </CustomText>
      </View>
      <View style={{ flex: 1 }}>
        <CustomText variant={occurrence.status === 'rest' ? 'body' : 'bodyStrong'} color={occurrence.status === 'rest' ? colors.inkMuted : colors.ink}>
          {occurrence.workoutName ?? 'Rest day'}
        </CustomText>
      </View>
      <StatusPill status={occurrence.status} pushed={occurrence.pushCount > 0} />
    </TouchableOpacity>
  );
};
