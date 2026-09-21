import { BodyWeightEntry, Id, LocalDate, Session } from '../models';
import { addDays, daysBetween, weekdayOf } from './dates';

/** Epley estimate of a one-rep max. Returns the weight itself for a single. */
export const estimateOneRepMax = (weightKg: number, reps: number): number => (reps <= 1 ? weightKg : weightKg * (1 + reps / 30));

/** Monday-based start of the week containing `date`. */
export const weekStart = (date: LocalDate): LocalDate => addDays(date, -((weekdayOf(date) + 6) % 7));

export interface WeekPoint {
  weekStart: LocalDate;
  volumeKg: number;
  sessions: number;
  sets: number;
}

/** One point per week for the last `weeks` weeks ending in the week of `todayDate`, oldest first. */
export const weeklySeries = (sessions: Session[], todayDate: LocalDate, weeks: number): WeekPoint[] => {
  const end = weekStart(todayDate);
  const points: WeekPoint[] = Array.from({ length: weeks }, (_, i) => ({ weekStart: addDays(end, -7 * (weeks - 1 - i)), volumeKg: 0, sessions: 0, sets: 0 }));
  const index = new Map(points.map((p, i) => [p.weekStart, i]));
  for (const s of sessions) {
    if (s.status !== 'completed') continue;
    const i = index.get(weekStart(s.date));
    if (i === undefined) continue;
    const p = points[i];
    p.sessions += 1;
    for (const ex of s.exercises) {
      for (const set of ex.sets) {
        if (!set.completed) continue;
        p.sets += 1;
        p.volumeKg += (set.weightKg ?? 0) * (set.reps ?? 0);
      }
    }
  }
  return points;
};

export interface ExercisePoint {
  date: LocalDate;
  sessionId: Id;
  /** Heaviest completed set. */
  topWeightKg: number | null;
  /** Best Epley estimate across completed sets. */
  estOneRepMaxKg: number | null;
  totalReps: number;
  volumeKg: number;
  /** Longest completed hold, for timed exercises. */
  bestDurationSec: number | null;
}

/** Per-session history of one exercise, oldest first. */
export const exerciseHistory = (sessions: Session[], exerciseId: Id): ExercisePoint[] =>
  [...sessions]
    .filter(s => s.status === 'completed')
    .sort((a, b) => a.startedAt - b.startedAt)
    .flatMap(s => {
      const ex = s.exercises.find(e => e.exerciseId === exerciseId);
      if (!ex) return [];
      const done = ex.sets.filter(set => set.completed);
      if (done.length === 0) return [];
      const weights = done.map(set => set.weightKg).filter((w): w is number => w !== null);
      const est = done.filter(set => set.weightKg !== null && set.reps).map(set => estimateOneRepMax(set.weightKg!, set.reps!));
      const durations = done.map(set => set.durationSec).filter((d): d is number => d !== null);
      return [
        {
          date: s.date,
          sessionId: s.id,
          topWeightKg: weights.length ? Math.max(...weights) : null,
          estOneRepMaxKg: est.length ? Math.max(...est) : null,
          totalReps: done.reduce((n, set) => n + (set.reps ?? 0), 0),
          volumeKg: done.reduce((n, set) => n + (set.weightKg ?? 0) * (set.reps ?? 0), 0),
          bestDurationSec: durations.length ? Math.max(...durations) : null,
        },
      ];
    });

/** Exercises the user has logged, most recent first, with session counts. */
export const loggedExercises = (sessions: Session[]): { exerciseId: Id; exerciseName: string; sessions: number; lastDate: LocalDate }[] => {
  const map = new Map<Id, { exerciseId: Id; exerciseName: string; sessions: number; lastDate: LocalDate }>();
  for (const s of sessions) {
    if (s.status !== 'completed') continue;
    for (const ex of s.exercises) {
      if (!ex.sets.some(set => set.completed)) continue;
      const cur = map.get(ex.exerciseId);
      if (cur) {
        cur.sessions += 1;
        if (s.date > cur.lastDate) cur.lastDate = s.date;
      } else {
        map.set(ex.exerciseId, { exerciseId: ex.exerciseId, exerciseName: ex.exerciseName, sessions: 1, lastDate: s.date });
      }
    }
  }
  return [...map.values()].sort((a, b) => (a.lastDate < b.lastDate ? 1 : a.lastDate > b.lastDate ? -1 : 0));
};

export interface WeightPoint {
  date: LocalDate;
  weightKg: number;
  /** Exponentially smoothed trend, which is what to read progress from. */
  trendKg: number;
}

/**
 * Body weight with a smoothed trend line. Daily fluctuation is mostly water;
 * the trend uses a 10% exponential moving average per entry, a common choice
 * for weight tracking.
 */
export const weightSeries = (entries: BodyWeightEntry[]): WeightPoint[] => {
  const sorted = [...entries].sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : a.createdAt - b.createdAt));
  const byDate = new Map<LocalDate, number>();
  for (const e of sorted) byDate.set(e.date, e.weightKg); // last entry of a day wins
  let trend: number | null = null;
  return [...byDate.entries()].map(([date, weightKg]) => {
    trend = trend === null ? weightKg : trend + 0.1 * (weightKg - trend);
    return { date, weightKg, trendKg: trend };
  });
};

/** Change in trend weight between the first point on/after `since` and the latest. */
export const weightChangeSince = (series: WeightPoint[], since: LocalDate): number | null => {
  if (series.length < 2) return null;
  const start = series.find(p => p.date >= since);
  const end = series[series.length - 1];
  if (!start || start === end) return null;
  return end.trendKg - start.trendKg;
};

export interface WeekSummary {
  sessionsDone: number;
  sessionsScheduled: number;
  volumeKg: number;
  volumeChange: number | null;
}

export const thisWeekSummary = (sessions: Session[], scheduledThisWeek: number, todayDate: LocalDate): WeekSummary => {
  const [prev, cur] = weeklySeries(sessions, todayDate, 2);
  return {
    sessionsDone: cur.sessions,
    sessionsScheduled: scheduledThisWeek,
    volumeKg: cur.volumeKg,
    volumeChange: prev.volumeKg > 0 ? (cur.volumeKg - prev.volumeKg) / prev.volumeKg : null,
  };
};

/** Days since the previous record for the same exercise, or null if it was the first. */
export const daysRecordStood = (prsOfExercise: { date: LocalDate }[], pr: { date: LocalDate }): number | null => {
  const earlier = prsOfExercise.filter(p => p.date < pr.date).sort((a, b) => (a.date < b.date ? 1 : -1))[0];
  return earlier ? daysBetween(earlier.date, pr.date) : null;
};

export interface MuscleBreakdown {
  muscle: string;
  sets: number;
  reps: number;
  volumeKg: number;
  sessions: number;
  exercises: { exerciseId: Id; exerciseName: string; sets: number; reps: number; volumeKg: number }[];
}

/**
 * Per-muscle training load with the exercises that contributed, attributed
 * by each exercise's primary muscles. Sorted by sets, most first.
 */
export const muscleBreakdown = (sessions: Session[], primaryMusclesOf: (exerciseId: Id) => string[]): MuscleBreakdown[] => {
  const out = new Map<string, MuscleBreakdown & { sessionIds: Set<Id>; exerciseMap: Map<Id, MuscleBreakdown['exercises'][number]> }>();
  for (const s of sessions) {
    if (s.status !== 'completed') continue;
    for (const ex of s.exercises) {
      const done = ex.sets.filter(set => set.completed);
      if (done.length === 0) continue;
      const reps = done.reduce((n, set) => n + (set.reps ?? 0), 0);
      const volumeKg = done.reduce((n, set) => n + (set.weightKg ?? 0) * (set.reps ?? 0), 0);
      for (const muscle of primaryMusclesOf(ex.exerciseId)) {
        let m = out.get(muscle);
        if (!m) {
          m = { muscle, sets: 0, reps: 0, volumeKg: 0, sessions: 0, exercises: [], sessionIds: new Set(), exerciseMap: new Map() };
          out.set(muscle, m);
        }
        m.sets += done.length;
        m.reps += reps;
        m.volumeKg += volumeKg;
        m.sessionIds.add(s.id);
        const e = m.exerciseMap.get(ex.exerciseId) ?? { exerciseId: ex.exerciseId, exerciseName: ex.exerciseName, sets: 0, reps: 0, volumeKg: 0 };
        e.sets += done.length;
        e.reps += reps;
        e.volumeKg += volumeKg;
        m.exerciseMap.set(ex.exerciseId, e);
      }
    }
  }
  return [...out.values()]
    .map(({ sessionIds, exerciseMap, ...m }) => ({ ...m, sessions: sessionIds.size, exercises: [...exerciseMap.values()].sort((a, b) => b.sets - a.sets) }))
    .sort((a, b) => b.sets - a.sets);
};

export interface MuscleWeekPoint {
  weekStart: LocalDate;
  sets: number;
  reps: number;
  volumeKg: number;
}

/** Weekly sets and volume for one muscle over the last `weeks` weeks, oldest first. */
export const muscleWeeklySeries = (
  sessions: Session[],
  muscle: string,
  primaryMusclesOf: (exerciseId: Id) => string[],
  todayDate: LocalDate,
  weeks: number,
): MuscleWeekPoint[] => {
  const end = weekStart(todayDate);
  const points: MuscleWeekPoint[] = Array.from({ length: weeks }, (_, i) => ({ weekStart: addDays(end, -7 * (weeks - 1 - i)), sets: 0, reps: 0, volumeKg: 0 }));
  const index = new Map(points.map((p, i) => [p.weekStart, i]));
  for (const s of sessions) {
    if (s.status !== 'completed') continue;
    const i = index.get(weekStart(s.date));
    if (i === undefined) continue;
    for (const ex of s.exercises) {
      if (!primaryMusclesOf(ex.exerciseId).includes(muscle)) continue;
      for (const set of ex.sets) {
        if (!set.completed) continue;
        points[i].sets += 1;
        points[i].reps += set.reps ?? 0;
        points[i].volumeKg += (set.weightKg ?? 0) * (set.reps ?? 0);
      }
    }
  }
  return points;
};
