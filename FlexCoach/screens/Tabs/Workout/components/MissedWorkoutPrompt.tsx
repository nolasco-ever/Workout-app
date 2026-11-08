import React, { useEffect, useRef, useState } from 'react';
import { Alert, View } from 'react-native';
import { useAuth } from '../../../../data/auth/AuthProvider';
import { Cycle, LocalDate, Occurrence, Plan } from '../../../../data/models';
import { addDays, fromLocalDate } from '../../../../data/engine/dates';
import { useWorkoutHome } from '../../../../data/hooks/useWorkoutHome';
import { beginMissedPrompt, moveDayTo, occupantsOn, pushDayTo, skipDay } from '../../../../data/services/workoutService';
import { listNames } from './notToday';
import { BottomSheet } from '../../../../components/overlays/BottomSheet';
import { CalendarPicker } from '../../../../components/inputs/CalendarPicker';
import { PrimaryButton } from '../../../../components/buttons/PrimaryButton';
import { CustomText } from '../../../../components/text/customText';
import { useTheme } from '../../../../theme';

const shortDate = (d: LocalDate) => fromLocalDate(d).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });

interface Pending {
  plan: Plan;
  cycle: Cycle;
  /** The missed day's items; the day is handled as a whole (v1 #10). */
  ask: Occurrence[];
  skipped: Occurrence[];
  todayDate: LocalDate;
  /** What is still to do today, by name, or null. */
  todaysNames: string[] | null;
}

/**
 * The in-app version of the missed-workout notification: a sheet on the
 * first open after a workout day went by, asking what to do with it. Do
 * it today, move it to a day of their choosing, or skip it. The day is
 * handled as a whole: everything missed on it moves or is skipped
 * together. Only the most recent missed day is asked about; older ones are
 * skipped first. Shown once per missed day (flagged on its occurrences).
 * Mount once at the app root for signed-in accounts.
 */
export const MissedWorkoutPrompt = () => {
  const { colors, spacing } = useTheme();
  const { uid, profile } = useAuth();
  const home = useWorkoutHome();
  const [pending, setPending] = useState<Pending | null>(null);
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<'ask' | 'move'>('ask');
  const [date, setDate] = useState<LocalDate>(home.todayDate);
  const [busy, setBusy] = useState<string | null>(null);
  // One attempt per missed workout per launch, whatever the live cycle does meanwhile.
  const attempted = useRef<string | null>(null);

  const latest = home.overdue[home.overdue.length - 1];
  const candidateId = !home.loading && home.plan && home.cycle && !home.inProgressSession && !home.cycleFinished && latest && !latest.missedPromptedAt ? latest.id : null;

  useEffect(() => {
    if (!uid || !candidateId || !home.plan || !home.cycle || attempted.current === candidateId || pending) return;
    attempted.current = candidateId;
    const plan = home.plan;
    const todayLeft = home.todayOccurrences.filter(o => o.status === 'scheduled').map(o => o.workoutName ?? 'a workout');
    const todaysNames = todayLeft.length ? todayLeft : null;
    beginMissedPrompt(uid, home.cycle, home.todayDate)
      .then(result => {
        if (!result) return;
        setPending({ plan, cycle: result.cycle, ask: result.ask, skipped: result.skipped, todayDate: home.todayDate, todaysNames });
        setMode('ask');
        setDate(addDays(home.todayDate, 1));
        setOpen(true);
      })
      .catch(err => console.warn('missed prompt failed', err));
    // Only the candidate matters; the rest is read when it changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uid, candidateId]);

  const close = () => {
    setOpen(false);
    setTimeout(() => setPending(null), 300);
  };

  const run = async (key: string, fn: () => Promise<void>) => {
    setBusy(key);
    try {
      await fn();
      close();
    } catch (err) {
      console.warn(err);
      Alert.alert('Something went wrong', 'That change was not saved. Try again from the Workout tab.');
    } finally {
      setBusy(null);
    }
  };

  if (!pending || !uid) return null;
  const { plan, cycle, ask, skipped, todayDate, todaysNames } = pending;
  const missedDate = ask[0].date;
  const one = ask.length === 1;
  const name = listNames(ask.map(o => o.workoutName ?? 'a workout'));
  const weeklyEnd = plan.schedule.mode === 'weekly' ? cycle.endDate : undefined;
  const tomorrow = addDays(todayDate, 1);
  const canMove = !weeklyEnd || weeklyEnd >= tomorrow;
  const it = one ? 'it' : 'them';
  // Doing it today bumps what is left of today a day; on a weekly cycle's last day there is no day left for it.
  const options = todaysNames
    ? `Do ${it} today and ${listNames(todaysNames)} ${canMove ? `move${todaysNames.length === 1 ? 's' : ''} to tomorrow` : `drop${todaysNames.length === 1 ? 's' : ''} out of this cycle`}. Or skip ${it} and stay on schedule.`
    : canMove
      ? `Do ${it} today, pick another day, or skip ${it} for this cycle.`
      : `Do ${it} today, or skip ${it} for this cycle.`;
  const body = `Looks like you missed your ${name} ${one ? 'workout' : 'workouts'}. ${options}`;
  const there = occupantsOn(cycle, date);
  const moveNote =
    there.items.length > 0
      ? `${shortDate(date)} has ${listNames(there.items.map(o => o.workoutName ?? 'a workout'))}. ${there.items.length === 1 ? 'It moves' : 'They move'} a day later to make room.`
      : there.rest
        ? `${shortDate(date)} is a rest day; ${one ? 'it takes' : 'they take'} the empty slot instead.`
        : `${shortDate(date)} is free.`;

  return (
    <BottomSheet
      open={open}
      title={mode === 'ask' ? (one ? 'Missed workout' : 'Missed workouts') : 'Pick a new day'}
      onClose={close}
      footer={
        mode === 'ask' ? (
          <View style={{ gap: spacing.sm }}>
            <PrimaryButton label="Do it today" busy={busy === 'today'} disabled={!!busy} onPress={() => run('today', async () => { await pushDayTo(uid, plan, cycle, missedDate, todayDate, profile); })} />
            {canMove && <PrimaryButton label="Pick another day" variant="outline" disabled={!!busy} onPress={() => setMode('move')} />}
            <PrimaryButton label="Skip it" variant="quiet" busy={busy === 'skip'} disabled={!!busy} onPress={() => run('skip', async () => { await skipDay(uid, cycle, missedDate, profile); })} />
          </View>
        ) : (
          <View style={{ gap: spacing.sm }}>
            <PrimaryButton label={`Move to ${shortDate(date)}`} busy={busy === 'move'} disabled={!!busy} onPress={() => run('move', async () => { await moveDayTo(uid, plan, cycle, missedDate, date, profile); })} />
            <PrimaryButton label="Back" variant="quiet" disabled={!!busy} onPress={() => setMode('ask')} />
          </View>
        )
      }
    >
      {mode === 'ask' ? (
        <>
          <CustomText variant="body" color={colors.inkMuted}>{body}</CustomText>
          {skipped.length > 0 && (
            <CustomText variant="caption" color={colors.inkMuted}>
              {listNames(skipped.map(o => o.workoutName ?? 'a workout'))} {skipped.length === 1 ? 'was' : 'were'} missed before {it} and {skipped.length === 1 ? 'has' : 'have'} been skipped for this cycle.
            </CustomText>
          )}
        </>
      ) : (
        <>
          <CalendarPicker value={date} onChange={setDate} minDate={tomorrow} maxDate={weeklyEnd} today={todayDate} />
          <CustomText variant="caption" color={colors.inkMuted}>
            {moveNote}{weeklyEnd ? ' This plan runs on fixed weeks, so it can only move within this cycle.' : ''}
          </CustomText>
        </>
      )}
      <View style={{ height: spacing.xs }} />
    </BottomSheet>
  );
};
