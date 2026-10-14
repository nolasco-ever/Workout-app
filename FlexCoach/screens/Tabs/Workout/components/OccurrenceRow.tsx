import React from 'react';
import { TouchableOpacity, View } from 'react-native';
import { LocalDate, Occurrence } from '../../../../data/models';
import { fromLocalDate } from '../../../../data/engine/dates';
import { CustomText } from '../../../../components/text/customText';
import { useTheme } from '../../../../theme';
import { StatusPill } from './StatusPill';

const DAY = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

/**
 * One calendar day of the cycle: the date once, then a line per workout on
 * it, each with its own status. A day with no workout on it is a rest day,
 * whether or not a rest occurrence happens to sit there; two workouts done
 * on the same day share the one date.
 */
export const DayRow = ({ date, occurrences, isToday, onOpen }: { date: LocalDate; occurrences: Occurrence[]; isToday: boolean; onOpen: (o: Occurrence) => void }) => {
  const { colors, spacing } = useTheme();
  const d = fromLocalDate(date);
  const workouts = occurrences.filter(o => o.status !== 'rest' && o.workoutId);
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingLeft: spacing.lg }}>
      <View style={{ width: 44 }}>
        <CustomText variant="overline" color={isToday ? colors.accent : colors.inkMuted}>
          {DAY[d.getDay()]}
        </CustomText>
        <CustomText variant="bodyStrong" color={isToday ? colors.accent : colors.ink}>
          {d.getDate()}
        </CustomText>
      </View>
      <View style={{ flex: 1 }}>
        {workouts.length === 0 ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.md, paddingRight: spacing.lg }}>
            <View style={{ flex: 1 }}>
              <CustomText variant="body" color={colors.inkMuted}>Rest day</CustomText>
            </View>
            <StatusPill status="rest" pushed={false} />
          </View>
        ) : (
          workouts.map((o, i) => (
            <TouchableOpacity key={o.id} onPress={() => onOpen(o)} style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.md, paddingRight: spacing.lg, borderTopWidth: i === 0 ? 0 : 1, borderTopColor: colors.line }}>
              <View style={{ flex: 1 }}>
                <CustomText variant="bodyStrong" color={colors.ink}>{o.workoutName}</CustomText>
              </View>
              <StatusPill status={o.status} pushed={o.pushCount > 0} />
            </TouchableOpacity>
          ))
        )}
      </View>
    </View>
  );
};
