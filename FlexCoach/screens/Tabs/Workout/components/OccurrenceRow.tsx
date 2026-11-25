import React from 'react';
import { TouchableOpacity, View } from 'react-native';
import { LocalDate, Occurrence, Session } from '../../../../data/models';
import { fromLocalDate } from '../../../../data/engine/dates';
import { sessionDisplayName } from '../../../../data/engine/sessionExtras';
import { CustomText } from '../../../../components/text/customText';
import { useTheme } from '../../../../theme';
import { StatusPill } from './StatusPill';

const DAY = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

/**
 * One calendar day of the cycle: the date, the workout on it and its
 * status, one tappable row. A day with no workout on it is a rest day,
 * whether or not a rest occurrence happens to sit there. The rare day two
 * workouts landed on shows the date once with a line per workout. A quick
 * workout finished that day sits on it too, so a rest day you trained on
 * no longer reads as rest (build 22 feedback).
 */
export const DayRow = ({
  date,
  occurrences,
  quickSessions = [],
  isToday,
  onOpen,
  onOpenSession,
}: {
  date: LocalDate;
  occurrences: Occurrence[];
  quickSessions?: Session[];
  isToday: boolean;
  onOpen: (o: Occurrence) => void;
  onOpenSession: (s: Session) => void;
}) => {
  const { colors, spacing } = useTheme();
  const d = fromLocalDate(date);
  const planned = occurrences.filter(o => o.status !== 'rest' && o.workoutId);
  type Line = { key: string; name: string; status: Occurrence['status']; pushed: boolean; open: () => void };
  const workouts: Line[] = [
    ...planned.map(o => ({ key: o.id, name: o.workoutName ?? '', status: o.status, pushed: o.pushCount > 0, open: () => onOpen(o) })),
    ...quickSessions.map(s => ({ key: s.id, name: sessionDisplayName(s), status: 'completed' as const, pushed: false, open: () => onOpenSession(s) })),
  ];
  const dateColumn = (
    <View style={{ width: 44 }}>
      <CustomText variant="overline" color={isToday ? colors.ink : colors.inkMuted}>
        {DAY[d.getDay()]}
      </CustomText>
      <CustomText variant="bodyStrong" color={colors.ink}>
        {d.getDate()}
      </CustomText>
    </View>
  );

  if (workouts.length <= 1) {
    const o = workouts[0];
    return (
      <TouchableOpacity
        disabled={!o}
        onPress={o?.open}
        style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.md, paddingHorizontal: spacing.lg }}
      >
        {dateColumn}
        <View style={{ flex: 1 }}>
          <CustomText variant={o ? 'bodyStrong' : 'body'} color={o ? colors.ink : colors.inkMuted}>
            {o?.name ?? 'Rest day'}
          </CustomText>
        </View>
        <StatusPill status={o ? o.status : 'rest'} pushed={!!o && o.pushed} />
      </TouchableOpacity>
    );
  }

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingLeft: spacing.lg }}>
      {dateColumn}
      <View style={{ flex: 1 }}>
        {workouts.map((o, i) => (
          <TouchableOpacity key={o.key} onPress={o.open} style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.md, paddingRight: spacing.lg, borderTopWidth: i === 0 ? 0 : 1, borderTopColor: colors.line }}>
            <View style={{ flex: 1 }}>
              <CustomText variant="bodyStrong" color={colors.ink}>{o.name}</CustomText>
            </View>
            <StatusPill status={o.status} pushed={o.pushed} />
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};
