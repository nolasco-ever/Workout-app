import React, { useState } from 'react';
import { Alert, ScrollView, TouchableOpacity, View } from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { SafeAreaView } from '../../../../components/layout/SafeAreaView';
import { Cycle, LocalDate, Occurrence, Plan } from '../../../../data/models';
import { addDays, fromLocalDate } from '../../../../data/engine/dates';
import { findWorkout } from '../../../../data/engine/schedule';
import { isCardioItem } from '../../../../data/engine/planItems';
import { moveDayTo, occupantsOn, pushDayTo, skipDay } from '../../../../data/services/workoutService';
import { useAuth } from '../../../../data/auth/AuthProvider';
import { listNames } from '../components/notToday';
import { CalendarPicker } from '../../../../components/inputs/CalendarPicker';
import { PrimaryButton } from '../../../../components/buttons/PrimaryButton';
import { CustomText } from '../../../../components/text/customText';
import { Icon, IconSource } from '../../../../components/icons/Icon';
import { directionIcons, generalIcons } from '../../../../components/icons/icon-library';
import { useComfortableColumn } from '../../../../components/layout/useComfortableColumn';
import { useTheme } from '../../../../theme';

export interface MissedWorkoutParams {
  plan: Plan;
  cycle: Cycle;
  /** The missed day's items; the day is handled as a whole (v1 #10). */
  ask: Occurrence[];
  /** Older missed items, already skipped. */
  skipped: Occurrence[];
  todayDate: LocalDate;
  /** What is still to do today, by name, or null. */
  todaysNames: string[] | null;
}

const longDate = (d: LocalDate) => fromLocalDate(d).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' });
const shortDate = (d: LocalDate) => fromLocalDate(d).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });

/**
 * Workout missed (v1 #7, option A on the canvas): a modal on the first open
 * after a workout day went by. The gold "Missed" label and the day's items,
 * then Actions: Do them today, Pick another day (the calendar opens in
 * place), or Skip them (asks first). Each says what it does. Closing it
 * leaves the day as it is; the Workout tab still offers it.
 */
export const MissedWorkoutScreen = () => {
  const navigation = useNavigation();
  const { params } = useRoute<RouteProp<{ MissedWorkoutScreen: MissedWorkoutParams }, 'MissedWorkoutScreen'>>();
  const { plan, cycle, ask, skipped, todayDate, todaysNames } = params;
  const { colors, spacing, radius } = useTheme();
  const column = useComfortableColumn();
  const { uid, profile } = useAuth();
  const [picking, setPicking] = useState(false);
  const tomorrow = addDays(todayDate, 1);
  const [date, setDate] = useState<LocalDate>(tomorrow);
  const [busy, setBusy] = useState<string | null>(null);

  const missedDate = ask[0].date;
  const one = ask.length === 1;
  const name = listNames(ask.map(o => o.workoutName ?? 'a workout'));
  const weeklyEnd = plan.schedule.mode === 'weekly' ? cycle.endDate : undefined;
  // On a weekly cycle's last day there is no other day to move to.
  const canMove = !weeklyEnd || weeklyEnd >= tomorrow;
  const todayLeft = todaysNames && todaysNames.length ? todaysNames : null;
  const todaySub = todayLeft
    ? `${listNames(todayLeft)} ${canMove ? `move${todayLeft.length === 1 ? 's' : ''} to tomorrow` : `drop${todayLeft.length === 1 ? 's' : ''} out of this cycle`}`
    : 'Nothing else is on today';

  const there = occupantsOn(cycle, date);
  const moveNote =
    there.items.length > 0
      ? `${shortDate(date)} has ${listNames(there.items.map(o => o.workoutName ?? 'a workout'))}. ${there.items.length === 1 ? 'It moves' : 'They move'} a day later to make room.`
      : there.rest
        ? `${shortDate(date)} is a rest day; ${one ? 'it takes' : 'they take'} the empty slot instead.`
        : `${shortDate(date)} is free.`;

  const run = async (key: string, fn: () => Promise<void>) => {
    if (!uid || busy) return;
    setBusy(key);
    try {
      await fn();
      navigation.goBack();
    } catch (err) {
      console.warn(err);
      Alert.alert('Something went wrong', 'That change was not saved. Try again from the Workout tab.');
    } finally {
      setBusy(null);
    }
  };

  const doToday = () => run('today', async () => { await pushDayTo(uid!, plan, cycle, missedDate, todayDate, profile); });
  const skip = () =>
    Alert.alert(`Skip ${name}?`, `${one ? "It's" : "They're"} counted as missed and the cycle carries on.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Skip', style: 'destructive', onPress: () => { run('skip', async () => { await skipDay(uid!, cycle, missedDate, profile); }).catch(() => undefined); } },
    ]);

  const kindIcon = (o: Occurrence): IconSource => {
    const w = findWorkout(plan, o.workoutId);
    return w && isCardioItem(w) ? generalIcons.cardio : w?.type === 'stretching' ? generalIcons.stretching : generalIcons.dumbbell;
  };

  const Row = ({ icon, tint, color, title, sub, first, onPress, trailing, label }: { icon: IconSource; tint: string; color: string; title: string; sub: string; first?: boolean; onPress: () => void; trailing?: React.ReactNode; label?: string }) => (
    <TouchableOpacity
      onPress={onPress}
      disabled={!!busy}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={label ?? `${title}. ${sub}`}
      style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, minHeight: 68, paddingVertical: spacing.sm, borderTopWidth: first ? 0 : 1, borderTopColor: colors.line, opacity: busy ? 0.6 : 1 }}
    >
      <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: tint, alignItems: 'center', justifyContent: 'center' }}>
        <Icon icon={icon} size={20} color={color} weight="fill" />
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <CustomText variant="bodyStrong">{title}</CustomText>
        <CustomText variant="caption" color={colors.inkMuted}>{sub}</CustomText>
      </View>
      {trailing}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView edges={['bottom', 'left', 'right']} style={{ flex: 1, backgroundColor: colors.ground }}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[{ padding: spacing.lg, gap: spacing.md }, column]}>
        <CustomText variant="overline" color={colors.warning}>Missed · {longDate(missedDate)}</CustomText>
        <View style={{ borderRadius: radius.lg, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, paddingHorizontal: spacing.md, paddingVertical: spacing.xs }}>
          {ask.map((o, i) => (
            <View key={o.id} style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, minHeight: 40, borderTopWidth: i === 0 ? 0 : 1, borderTopColor: colors.line }}>
              <Icon icon={kindIcon(o)} size={16} color={colors.inkMuted} />
              <CustomText variant="bodyStrong">{o.workoutName ?? 'Workout'}</CustomText>
            </View>
          ))}
        </View>
        {skipped.length > 0 && (
          <CustomText variant="caption" color={colors.inkMuted}>
            {listNames(skipped.map(o => o.workoutName ?? 'a workout'))} {skipped.length === 1 ? 'was' : 'were'} missed before {one ? 'it' : 'them'} and {skipped.length === 1 ? 'has' : 'have'} been skipped for this cycle.
          </CustomText>
        )}

        <CustomText variant="overline" color={colors.inkMuted} style={{ marginTop: spacing.xs }}>Actions</CustomText>
        <View style={{ borderRadius: radius.lg, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, paddingHorizontal: spacing.md }}>
          <Row icon={generalIcons.play} tint={colors.accentTint} color={colors.accent} title={one ? 'Do it today' : 'Do them today'} sub={todaySub} first onPress={doToday} />
          {canMove && (
            <>
              <Row
                icon={generalIcons.calendarDay}
                tint={colors.infoTint}
                color={colors.info}
                title="Pick another day"
                sub="Any day left in this cycle"
                onPress={() => setPicking(p => !p)}
                label={`Pick another day. ${picking ? 'Open' : 'Closed'}`}
                trailing={<Icon icon={picking ? directionIcons.angleUp : directionIcons.angleDown} size={18} color={colors.inkMuted} />}
              />
              {picking && (
                <View style={{ gap: spacing.sm, paddingBottom: spacing.md }}>
                  <CalendarPicker value={date} onChange={setDate} minDate={tomorrow} maxDate={weeklyEnd} today={todayDate} />
                  <CustomText variant="caption" color={colors.inkMuted}>
                    {moveNote}{weeklyEnd ? ' This plan runs on fixed weeks, so it can only move within this cycle.' : ''}
                  </CustomText>
                  <PrimaryButton label={`Move to ${shortDate(date)}`} busy={busy === 'move'} disabled={!!busy} onPress={() => run('move', async () => { await moveDayTo(uid!, plan, cycle, missedDate, date, profile); })} />
                </View>
              )}
            </>
          )}
          <Row icon={directionIcons.skip} tint={colors.surfaceRaised} color={colors.inkMuted} title={one ? 'Skip it' : 'Skip them'} sub="Counted as missed. The cycle carries on." onPress={skip} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};
