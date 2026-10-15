import React from 'react';
import { TouchableOpacity, View } from 'react-native';
import { LocalDate, Occurrence } from '../../../../data/models';
import { fromLocalDate } from '../../../../data/engine/dates';
import { CustomText } from '../../../../components/text/customText';
import { useTheme } from '../../../../theme';
import { StatusPill } from './StatusPill';

const DAY = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

/**
 * One calendar day of the cycle: the date, the workout on it and its
 * status, one tappable row. A day with no workout on it is a rest day,
 * whether or not a rest occurrence happens to sit there. The rare day two
 * workouts landed on shows the date once with a line per workout.
 */
export const DayRow = ({ date, occurrences, isToday, onOpen }: { date: LocalDate; occurrences: Occurrence[]; isToday: boolean; onOpen: (o: Occurrence) => void }) => {
  const { colors, spacing } = useTheme();
  const d = fromLocalDate(date);
  const workouts = occurrences.filter(o => o.status !== 'rest' && o.workoutId);
  const dateColumn = (
    <View style={{ width: 44 }}>
      <CustomText variant="overline" color={isToday ? colors.accent : colors.inkMuted}>
        {DAY[d.getDay()]}
      </CustomText>
      <CustomText variant="bodyStrong" color={isToday ? colors.accent : colors.ink}>
        {d.getDate()}
      </CustomText>
    </View>
  );

  if (workouts.length <= 1) {
    const o = workouts[0];
    return (
      <TouchableOpacity
        disabled={!o}
        onPress={o ? () => onOpen(o) : undefined}
        style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.md, paddingHorizontal: spacing.lg }}
      >
        {dateColumn}
        <View style={{ flex: 1 }}>
          <CustomText variant={o ? 'bodyStrong' : 'body'} color={o ? colors.ink : colors.inkMuted}>
            {o?.workoutName ?? 'Rest day'}
          </CustomText>
        </View>
        <StatusPill status={o ? o.status : 'rest'} pushed={!!o && o.pushCount > 0} />
      </TouchableOpacity>
    );
  }

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingLeft: spacing.lg }}>
      {dateColumn}
      <View style={{ flex: 1 }}>
        {workouts.map((o, i) => (
          <TouchableOpacity key={o.id} onPress={() => onOpen(o)} style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.md, paddingRight: spacing.lg, borderTopWidth: i === 0 ? 0 : 1, borderTopColor: colors.line }}>
            <View style={{ flex: 1 }}>
              <CustomText variant="bodyStrong" color={colors.ink}>{o.workoutName}</CustomText>
            </View>
            <StatusPill status={o.status} pushed={o.pushCount > 0} />
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};
