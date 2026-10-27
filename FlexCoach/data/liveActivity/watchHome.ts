import { Cycle, LocalDate, Occurrence, OccurrenceStatus, Plan, Session, WeightUnit } from '../models';
import { addDays, fromLocalDate } from '../engine/dates';
import { findWorkout } from '../engine/schedule';
import { formatWeight } from '../engine/units';
import { canonicalExerciseId } from '../catalog/exerciseIds';
import { catalogName } from '../catalog/exerciseCatalog';

/**
 * What the Apple Watch shows with no workout running (v1 #6, step 4): the
 * Workout tab in small. The cycle's headline, today's card (the workout with
 * Start and Preview, or the rest day), Quick workout, and the cycle's days,
 * plus the exercises done before for a quick workout. Built on the phone and
 * sent whenever it changes; the Watch only draws it.
 */
export type WatchHomeDay = {
  date: LocalDate;
  /** "MON" */
  weekday: string;
  day: number;
  /** The workout, or "Rest". */
  name: string;
  status: OccurrenceStatus;
  today: boolean;
  occurrenceId?: string;
  workoutId?: string;
  /** Start's label in the day's preview, when it can start: "Start workout", "Do this workout today", "Do it today". */
  startLabel?: string;
};

/** `sets` is 0 for cardio, which is one entry rather than sets. */
export type WatchHomeWorkout = { name: string; exercises: { name: string; sets: number }[] };

export type WatchHomeToday =
  | { kind: 'workout'; title: string; name: string; detail: string; status: OccurrenceStatus; occurrenceId: string; workoutId: string }
  | { kind: 'rest' | 'notStarted'; title: string; heading: string; text: string };

export type WatchHome = {
  /** "Push Pull Legs · Cycle 3", "Day 5 of 21", "4 of 12 done"; absent with no cycle running. */
  headline?: { overline: string; title: string; progress: string };
  today?: WatchHomeToday;
  /** A workout already going on the phone: Resume takes its place, as on the Workout tab. */
  inProgress?: { sessionId: string; name: string };
  /** No plan, or a plan with no cycle: a line in place of the cycle. */
  empty?: { title: string; text: string };
  days: WatchHomeDay[];
  /** The plan's workouts by id, for the day previews. */
  workouts: Record<string, WatchHomeWorkout>;
  /** Exercises from past workouts, newest first, for a quick workout: their last set ("185 lb × 8"). */
  recent: { id: string; name: string; last?: string }[];
};

const DAY = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
const shortDate = (d: LocalDate) => fromLocalDate(d).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
const mmss = (seconds: number): string => `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;

/** About how long a workout takes, as the Workout tab says it. */
const minutes = (plan: Plan, workoutId: string | null): number =>
  Math.round((findWorkout(plan, workoutId)?.exercises ?? []).reduce((s, e) => s + e.sets * (e.restSec + 45), 0) / 60);

/** The exercises of past workouts, newest first, once each, with the last set logged. */
export const recentExercises = (history: Session[], unit: WeightUnit, limit = 8): WatchHome['recent'] => {
  const seen = new Set<string>();
  const out: WatchHome['recent'] = [];
  const sessions = [...history].sort((a, b) => b.startedAt - a.startedAt);
  for (const session of sessions) {
    for (const ex of session.exercises) {
      const key = canonicalExerciseId(ex.exerciseId);
      if (seen.has(key)) continue;
      const set = [...ex.sets].reverse().find(s => s.completed && !s.warmup);
      if (!set) continue;
      seen.add(key);
      let last: string | undefined;
      switch (ex.measurement) {
        case 'weight_reps':
          last = set.weightKg !== null && set.reps ? `${formatWeight(set.weightKg, unit)} × ${set.reps}` : set.reps ? `${set.reps} reps` : undefined;
          break;
        case 'reps':
          last = set.reps ? `${set.reps} reps` : undefined;
          break;
        case 'time':
        case 'distance_time':
          last = set.durationSec ? mmss(set.durationSec) : undefined;
          break;
      }
      out.push({ id: ex.exerciseId, name: catalogName(ex.exerciseId, ex.exerciseName), ...(last ? { last } : {}) });
      if (out.length >= limit) return out;
    }
  }
  return out;
};

export const buildWatchHome = (args: {
  plan: Plan | null;
  cycle: Cycle | null;
  todayDate: LocalDate;
  todayOccurrence: Occurrence | null;
  upcoming: Occurrence[];
  inProgress: Session | null;
  cycleFinished: boolean;
  history: Session[];
  unit: WeightUnit;
}): WatchHome => {
  const { plan, cycle, todayDate, todayOccurrence, upcoming, inProgress, cycleFinished, history, unit } = args;
  const home: WatchHome = { days: [], workouts: {}, recent: recentExercises(history, unit) };
  if (inProgress) home.inProgress = { sessionId: inProgress.id, name: inProgress.workoutName };
  if (!plan) {
    home.empty = { title: 'No active plan', text: 'Make a plan on your phone and each day shows up here.' };
    return home;
  }
  if (!cycle) {
    home.empty = { title: 'Ready when you are', text: `${plan.name} has no cycle running. Start one on your phone.` };
    return home;
  }

  const occurrences = cycle.occurrences;
  const total = occurrences.filter(o => o.status !== 'rest').length;
  const done = occurrences.filter(o => o.status === 'completed').length;
  const notStarted = todayDate < cycle.startDate;
  const dayIndex = occurrences.findIndex(o => o.date >= todayDate);
  home.headline = {
    overline: `${plan.name} · Cycle ${cycle.number}`,
    title: notStarted ? `Starts ${shortDate(cycle.startDate)}` : dayIndex === -1 ? `${occurrences.length} days` : `Day ${dayIndex + 1} of ${occurrences.length}`,
    progress: `${done} of ${total} done`,
  };

  for (const w of plan.workouts) {
    home.workouts[w.id] = { name: w.name, exercises: [...w.exercises].sort((a, b) => a.order - b.order).map(e => ({ name: catalogName(e.exerciseId, e.exerciseName), sets: e.measurement === 'distance_time' ? 0 : e.sets })) };
  }

  // Every date of the cycle, as the Workout tab lists them: a day with no workout on it is a rest day.
  for (let d = cycle.startDate; d <= cycle.endDate && home.days.length < 60; d = addDays(d, 1)) {
    const date = fromLocalDate(d);
    const base = { date: d, weekday: DAY[date.getDay()], day: date.getDate(), today: d === todayDate };
    const workouts = occurrences.filter(o => o.date === d && o.status !== 'rest' && o.workoutId);
    if (workouts.length === 0) home.days.push({ ...base, name: 'Rest', status: 'rest' });
    for (const o of workouts) {
      const startLabel = o.status !== 'scheduled' || inProgress ? undefined : d === todayDate ? 'Start workout' : d > todayDate ? 'Do this workout today' : 'Do it today';
      home.days.push({ ...base, name: o.workoutName ?? findWorkout(plan, o.workoutId)?.name ?? 'Workout', status: o.status, occurrenceId: o.id, workoutId: o.workoutId!, ...(startLabel ? { startLabel } : {}) });
    }
  }

  if (cycleFinished || inProgress) return home;
  const title = `Today · ${shortDate(todayDate)}`;
  const todayWorkout = todayOccurrence ? findWorkout(plan, todayOccurrence.workoutId) : undefined;
  if (notStarted) {
    home.today = { kind: 'notStarted', title, heading: 'Not started yet', text: upcoming[0] ? `First up: ${upcoming[0].workoutName} on ${shortDate(upcoming[0].date)}` : `The cycle begins ${shortDate(cycle.startDate)}` };
  } else if (todayOccurrence && todayWorkout) {
    home.today = {
      kind: 'workout',
      title,
      name: todayWorkout.name,
      detail: `${todayWorkout.exercises.length} exercises · about ${minutes(plan, todayWorkout.id)} min`,
      status: todayOccurrence.status,
      occurrenceId: todayOccurrence.id,
      workoutId: todayWorkout.id,
    };
  } else {
    home.today = { kind: 'rest', title, heading: 'Rest day', text: upcoming[0] ? `Next up: ${upcoming[0].workoutName} on ${shortDate(upcoming[0].date)}` : 'Nothing else scheduled this cycle.' };
  }
  return home;
};
