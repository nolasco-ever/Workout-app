import React, { useEffect, useRef, useState } from 'react';
import { Alert, View } from 'react-native';
import { useAuth } from '../../../../data/auth/AuthProvider';
import { Cycle, LocalDate, Occurrence, Plan } from '../../../../data/models';
import { addDays, fromLocalDate } from '../../../../data/engine/dates';
import { useWorkoutHome } from '../../../../data/hooks/useWorkoutHome';
import { beginMissedPrompt, moveWorkoutToDate, occupantOn, pushWorkoutTo, skipWorkout } from '../../../../data/services/workoutService';
import { BottomSheet } from '../../../../components/overlays/BottomSheet';
import { CalendarPicker } from '../../../../components/inputs/CalendarPicker';
import { PrimaryButton } from '../../../../components/buttons/PrimaryButton';
import { CustomText } from '../../../../components/text/customText';
import { useTheme } from '../../../../theme';

const shortDate = (d: LocalDate) => fromLocalDate(d).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });

const listNames = (names: string[]): string => (names.length <= 1 ? names.join('') : `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`);

interface Pending {
  plan: Plan;
  cycle: Cycle;
  ask: Occurrence;
  skipped: Occurrence[];
  todayDate: LocalDate;
  todaysName: string | null;
}

/**
 * The in-app version of the missed-workout notification: a sheet on the
 * first open after a workout day went by, asking what to do with it. Do
 * it today, move it to a day of their choosing, or skip it. Only the most
 * recent missed workout is asked about; older ones are skipped first.
 * Shown once per missed workout (flagged on the occurrence). Mount once
 * at the app root for signed-in accounts.
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
    const todaysName = home.todayOccurrence?.status === 'scheduled' ? home.todayOccurrence.workoutName : null;
    beginMissedPrompt(uid, home.cycle, home.todayDate)
      .then(result => {
        if (!result) return;
        setPending({ plan, cycle: result.cycle, ask: result.ask, skipped: result.skipped, todayDate: home.todayDate, todaysName });
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
  const { plan, cycle, ask, skipped, todayDate, todaysName } = pending;
  const name = ask.workoutName ?? 'your';
  const weeklyEnd = plan.schedule.mode === 'weekly' ? cycle.endDate : undefined;
  const tomorrow = addDays(todayDate, 1);
  const canMove = !weeklyEnd || weeklyEnd >= tomorrow;
  // Doing it today bumps today's workout a day; on a weekly cycle's last day there is no day left for it.
  const options = todaysName
    ? `Do it today and ${todaysName} ${canMove ? 'moves to tomorrow' : 'drops out of this cycle'}. Or skip it and stay on schedule.`
    : canMove
      ? 'Do it today, pick another day, or skip it for this cycle.'
      : 'Do it today, or skip it for this cycle.';
  const body = `Looks like you missed your ${name} workout. ${options}`;
  const occupant = occupantOn(cycle, date, ask.id);
  const moveNote =
    occupant?.status === 'scheduled'
      ? `${shortDate(date)} has ${occupant.workoutName}. It moves a day later to make room.`
      : occupant?.status === 'rest'
        ? `${shortDate(date)} is a rest day; it takes the empty slot instead.`
        : `${shortDate(date)} is free.`;

  return (
    <BottomSheet
      open={open}
      title={mode === 'ask' ? 'Missed workout' : 'Pick a new day'}
      onClose={close}
      footer={
        mode === 'ask' ? (
          <View style={{ gap: spacing.sm }}>
            <PrimaryButton label="Do it today" busy={busy === 'today'} disabled={!!busy} onPress={() => run('today', async () => { await pushWorkoutTo(uid, plan, cycle, ask.id, todayDate, profile); })} />
            {canMove && <PrimaryButton label="Pick another day" variant="outline" disabled={!!busy} onPress={() => setMode('move')} />}
            <PrimaryButton label="Skip it" variant="quiet" busy={busy === 'skip'} disabled={!!busy} onPress={() => run('skip', async () => { await skipWorkout(uid, cycle, ask.id, profile); })} />
          </View>
        ) : (
          <View style={{ gap: spacing.sm }}>
            <PrimaryButton label={`Move to ${shortDate(date)}`} busy={busy === 'move'} disabled={!!busy} onPress={() => run('move', async () => { await moveWorkoutToDate(uid, plan, cycle, ask.id, date, profile); })} />
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
              {listNames(skipped.map(o => o.workoutName ?? 'a workout'))} {skipped.length === 1 ? 'was' : 'were'} missed before it and {skipped.length === 1 ? 'has' : 'have'} been skipped for this cycle.
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
