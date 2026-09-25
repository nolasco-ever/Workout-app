import { ClockTime, Cycle, LocalDate, NotificationPrefs, NotificationTarget, Occurrence, Session } from '../models';
import { addDays, fromLocalDate, weekdayOf } from './dates';
import { currentStreakDays } from './stats';

/**
 * Local (on-device) notifications are planned as pure data from the active
 * cycle, the user's sessions and their preferences. The app reconciles this
 * plan against the OS whenever any of those inputs change, so a notification
 * only exists while it is still relevant: complete the workout at 8am and the
 * 9am reminder is gone before it fires.
 */

export type NotificationKind =
  | 'workout_today'
  | 'workout_nudge'
  | 'streak_risk'
  | 'missed_workout'
  | 'plan_starts'
  | 'cycle_finished'
  | 'weigh_in'
  | 'rest_over';

export const defaultNotificationPrefs: NotificationPrefs = {
  enabled: true,
  workoutToday: true,
  eveningNudge: true,
  streakRisk: true,
  missedWorkout: true,
  planStarts: true,
  cycleFinished: true,
  restOver: true,
  weighIn: false,
  weighInWeekday: 1,
  morningTime: { hour: 9, minute: 0 },
  eveningTime: { hour: 18, minute: 0 },
  buddies: true,
};

/** Older profiles have no prefs, or are missing keys added later. */
export const withPrefDefaults = (prefs: Partial<NotificationPrefs> | null | undefined): NotificationPrefs => ({
  ...defaultNotificationPrefs,
  ...(prefs ?? {}),
  morningTime: prefs?.morningTime ?? defaultNotificationPrefs.morningTime,
  eveningTime: prefs?.eveningTime ?? defaultNotificationPrefs.eveningTime,
});

export interface PlannedNotification {
  /** Stable per kind and day so re-planning replaces rather than duplicates. */
  id: string;
  kind: NotificationKind;
  fireAt: number;
  title: string;
  body: string;
  target: NotificationTarget;
}

export interface PlanInput {
  cycle: Cycle | null;
  /** Every session, completed or not; used for streaks and "done today". */
  sessions: Session[];
  prefs: NotificationPrefs;
  todayDate: LocalDate;
  now: number;
  /** Date of the most recent body-weight entry, to skip a redundant weigh-in reminder. */
  lastWeighInDate?: LocalDate | null;
  /** How many days ahead to plan. iOS allows 64 pending notifications. */
  horizonDays?: number;
}

export const NOTIFICATION_ID_PREFIX = 'flex:';

const at = (date: LocalDate, time: ClockTime): number => {
  const d = fromLocalDate(date);
  d.setHours(time.hour, time.minute, 0, 0);
  return d.getTime();
};

const idFor = (kind: NotificationKind, date: LocalDate) => `${NOTIFICATION_ID_PREFIX}${kind}:${date}`;

const scheduledOn = (cycle: Cycle, date: LocalDate): Occurrence | undefined =>
  cycle.occurrences.find(o => o.date === date && o.status === 'scheduled' && o.workoutId !== null);

const inProgressOn = (cycle: Cycle, date: LocalDate): boolean =>
  cycle.occurrences.some(o => o.date === date && o.status === 'in_progress');

/**
 * Plan every time-based notification for the next `horizonDays` days.
 * Nothing here is stored in the feed; these are reminders that go stale
 * within hours, so they only ever live in the OS notification tray.
 */
export const planLocalNotifications = (input: PlanInput): PlannedNotification[] => {
  const { cycle, sessions, prefs, todayDate, now, lastWeighInDate = null, horizonDays = 14 } = input;
  if (!prefs.enabled) return [];

  const out: PlannedNotification[] = [];
  const push = (n: PlannedNotification) => {
    if (n.fireAt > now) out.push(n);
  };

  const completedSessions = sessions.filter(s => s.status === 'completed');
  const doneToday = completedSessions.some(s => s.date === todayDate);
  // Streak as it stands this morning, before today's workout.
  const streak = currentStreakDays(completedSessions, todayDate, addDays);

  const active = cycle && cycle.status === 'active' ? cycle : null;

  if (active && active.startDate > todayDate && prefs.planStarts) {
    const first = active.occurrences.find(o => o.workoutId !== null);
    const eve = addDays(active.startDate, -1);
    push({
      id: idFor('plan_starts', eve),
      kind: 'plan_starts',
      fireAt: at(eve, prefs.eveningTime),
      title: 'Your plan starts tomorrow',
      body: first?.workoutName ? `First up: ${first.workoutName}. Get some sleep.` : 'First workout is tomorrow. Get some sleep.',
      target: { screen: 'workout' },
    });
  }

  for (let offset = 0; offset < horizonDays; offset++) {
    const date = addDays(todayDate, offset);

    if (active) {
      const todaysWorkout = scheduledOn(active, date);
      // A workout still scheduled on the day before is one the user has not
      // completed, skipped or moved. Only the morning right after it gets a
      // nudge; the app asks again as soon as it is opened. Iterating from
      // today keeps older overdue days out.
      const missedYesterday = scheduledOn(active, addDays(date, -1));

      if (missedYesterday && prefs.missedWorkout) {
        push({
          id: idFor('missed_workout', date),
          kind: 'missed_workout',
          fireAt: at(date, prefs.morningTime),
          title: `You missed ${missedYesterday.workoutName ?? 'a workout'} yesterday`,
          body: todaysWorkout?.workoutName
            ? `Skip it or move it, then ${todaysWorkout.workoutName} is up today.`
            : 'Skip it, or move it to today and keep the cycle on track.',
          target: { screen: 'workout' },
        });
      } else if (todaysWorkout && prefs.workoutToday) {
        push({
          id: idFor('workout_today', date),
          kind: 'workout_today',
          fireAt: at(date, prefs.morningTime),
          title: `${todaysWorkout.workoutName ?? 'Workout'} day`,
          body: "It's on the schedule for today. Start when you're ready.",
          target: { screen: 'workout' },
        });
      }

      if (todaysWorkout && !inProgressOn(active, date)) {
        // The streak is only certain for today, or for tomorrow once today's
        // session is done. Further out it depends on days not yet trained.
        const streakAtRisk =
          offset === 0 ? (doneToday ? 0 : streak) : offset === 1 && doneToday ? streak : 0;
        if (streakAtRisk > 0 && prefs.streakRisk) {
          push({
            id: idFor('streak_risk', date),
            kind: 'streak_risk',
            fireAt: at(date, prefs.eveningTime),
            title: `Your ${streakAtRisk}-day streak ends tonight`,
            body: `${todaysWorkout.workoutName ?? 'Your workout'} is still waiting. Keep it alive.`,
            target: { screen: 'workout' },
          });
        } else if (prefs.eveningNudge) {
          push({
            id: idFor('workout_nudge', date),
            kind: 'workout_nudge',
            fireAt: at(date, prefs.eveningTime),
            title: `${todaysWorkout.workoutName ?? 'Your workout'} isn't done yet`,
            body: 'Still time to get it in today.',
            target: { screen: 'workout' },
          });
        }
      }

      if (prefs.cycleFinished && date === addDays(active.endDate, 1)) {
        push({
          id: idFor('cycle_finished', date),
          kind: 'cycle_finished',
          fireAt: at(date, prefs.morningTime),
          title: `Cycle ${active.number} is done`,
          body: 'See how it went and what comes next.',
          target: { screen: 'cycle_summary', cycleId: active.id },
        });
      }
    }

    if (prefs.weighIn && weekdayOf(date) === prefs.weighInWeekday && lastWeighInDate !== date) {
      push({
        id: idFor('weigh_in', date),
        kind: 'weigh_in',
        fireAt: at(date, prefs.morningTime),
        title: 'Weigh-in day',
        body: 'Log your weight before breakfast for the most consistent trend.',
        target: { screen: 'body_weight' },
      });
    }
  }

  return out.sort((a, b) => a.fireAt - b.fireAt);
};

export const REST_OVER_ID = `${NOTIFICATION_ID_PREFIX}rest_over`;

/** The one notification that is not planned from the calendar: rest timer done. */
export const planRestOverNotification = (
  startedAt: number,
  durationSec: number,
  sessionId: string,
  nextExerciseName: string | null,
): PlannedNotification => ({
  id: REST_OVER_ID,
  kind: 'rest_over',
  fireAt: startedAt + durationSec * 1000,
  title: 'Rest over. Go.',
  body: nextExerciseName ? `Next set: ${nextExerciseName}.` : 'Back to it.',
  target: { screen: 'session', sessionId },
});
