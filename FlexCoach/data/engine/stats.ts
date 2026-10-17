import { canonicalExerciseId } from '../catalog/exerciseIds';
import { Cycle, CycleSummary, Id, LoggedSet, PersonalRecord, Session, SessionExercise } from '../models';
import { isWorkingSet, workingSets } from './sets';

/**
 * The single best value for an exercise across a set of sessions, by the
 * measure that matters for its type.
 */
const bestValue = (ex: SessionExercise): { kind: PersonalRecord['kind']; value: number } | null => {
  const done = workingSets(ex.sets);
  if (done.length === 0) return null;
  const max = (vals: (number | null)[]) => Math.max(...vals.map(v => v ?? -Infinity));
  switch (ex.measurement) {
    case 'weight_reps': {
      const v = max(done.map(s => s.weightKg));
      return isFinite(v) ? { kind: 'weight', value: v } : null;
    }
    case 'reps': {
      const w = max(done.map(s => s.weightKg));
      if (isFinite(w) && w > 0) return { kind: 'weight', value: w };
      const r = max(done.map(s => s.reps));
      return isFinite(r) ? { kind: 'reps', value: r } : null;
    }
    case 'time': {
      const v = max(done.map(s => s.durationSec));
      return isFinite(v) ? { kind: 'duration', value: v } : null;
    }
    case 'distance_time': {
      const v = max(done.map(s => s.distanceM));
      return isFinite(v) ? { kind: 'distance', value: v } : null;
    }
  }
};

/** Best-ever value per exercise id. */
export const computeRecords = (sessions: Session[]): Map<Id, { kind: PersonalRecord['kind']; value: number }> => {
  const records = new Map<Id, { kind: PersonalRecord['kind']; value: number }>();
  for (const s of sessions) {
    for (const ex of s.exercises) {
      const best = bestValue(ex);
      if (!best) continue;
      const id = canonicalExerciseId(ex.exerciseId);
      const prev = records.get(id);
      if (!prev || best.value > prev.value) records.set(id, best);
    }
  }
  return records;
};

/** A set's value by the kind of record. */
const valueOf = (kind: PersonalRecord['kind'], set: LoggedSet): number | null =>
  kind === 'weight' ? set.weightKg : kind === 'reps' ? set.reps : kind === 'duration' ? set.durationSec : set.distanceM;

/**
 * Personal records set during `sessions`, judged against everything in
 * `history` that came before. Used both for achievements and the cycle summary.
 *
 * The first set ever logged of an exercise is the starting point, not a
 * record: it has nothing to beat. A later set that beats it is one, in that
 * same session or any after.
 */
export const findPersonalRecords = (sessions: Session[], history: Session[]): PersonalRecord[] => {
  const prior = computeRecords(history);
  const seen = new Map<Id, number>();
  const prs: PersonalRecord[] = [];
  const ordered = [...sessions].sort((a, b) => a.startedAt - b.startedAt);
  for (const s of ordered) {
    for (const ex of s.exercises) {
      const best = bestValue(ex);
      if (!best) continue;
      const id = canonicalExerciseId(ex.exerciseId);
      let previous = Math.max(prior.get(id)?.value ?? -Infinity, seen.get(id) ?? -Infinity);
      if (!isFinite(previous)) {
        const first = workingSets(ex.sets).map(st => valueOf(best.kind, st)).find((v): v is number => v !== null);
        if (first === undefined) continue;
        previous = first;
      }
      seen.set(id, Math.max(best.value, previous));
      if (best.value > previous) {
        prs.push({
          exerciseId: id,
          exerciseName: ex.exerciseName,
          kind: best.kind,
          value: best.value,
          previousValue: previous,
          sessionId: s.id,
          date: s.date,
        });
      }
    }
  }
  return prs;
};

export const summarizeCycle = (cycle: Cycle, cycleSessions: Session[], history: Session[]): CycleSummary => {
  const workouts = cycle.occurrences.filter(o => o.status !== 'rest');
  const completed = workouts.filter(o => o.status === 'completed');
  return {
    cycleId: cycle.id,
    planId: cycle.planId,
    number: cycle.number,
    startDate: cycle.startDate,
    endDate: cycle.endDate,
    totalWorkouts: workouts.length,
    completed: completed.length,
    completedOnTime: completed.filter(o => o.pushCount === 0).length,
    pushed: workouts.filter(o => o.pushCount > 0).length,
    skipped: workouts.filter(o => o.status === 'skipped').length,
    completionRate: workouts.length ? completed.length / workouts.length : 0,
    personalRecords: findPersonalRecords(cycleSessions, history),
  };
};

/** Total weight moved (kg × reps) for a session or list of sessions. Warm-ups don't count. */
export const totalVolumeKg = (sessions: Session[]): number =>
  sessions.reduce(
    (sum, s) =>
      sum +
      s.exercises.reduce(
        (exSum, ex) => exSum + ex.sets.reduce((setSum, set) => setSum + (isWorkingSet(set) ? (set.weightKg ?? 0) * (set.reps ?? 0) : 0), 0),
        0,
      ),
    0,
  );

/** Completed working sets across sessions, the number shown as "Sets" in summaries. */
export const countWorkingSets = (sessions: Session[]): number =>
  sessions.reduce((n, s) => n + s.exercises.reduce((m, ex) => m + workingSets(ex.sets).length, 0), 0);

/** Volume per primary muscle group, for the Home insights. */
export const volumeByMuscle = (
  sessions: Session[],
  primaryMusclesOf: (exerciseId: Id) => string[],
): Record<string, { volumeKg: number; sets: number; reps: number }> => {
  const out: Record<string, { volumeKg: number; sets: number; reps: number }> = {};
  for (const s of sessions) {
    for (const ex of s.exercises) {
      const muscles = primaryMusclesOf(ex.exerciseId);
      for (const set of ex.sets) {
        if (!isWorkingSet(set)) continue;
        for (const m of muscles) {
          const bucket = (out[m] ??= { volumeKg: 0, sets: 0, reps: 0 });
          bucket.sets += 1;
          bucket.reps += set.reps ?? 0;
          bucket.volumeKg += (set.weightKg ?? 0) * (set.reps ?? 0);
        }
      }
    }
  }
  return out;
};

/** Consecutive days ending today (or yesterday) with a completed session. */
export const currentStreakDays = (sessions: Session[], todayDate: string, addDays: (d: string, n: number) => string): number => {
  const days = new Set(sessions.filter(s => s.status === 'completed').map(s => s.date));
  let cursor = days.has(todayDate) ? todayDate : addDays(todayDate, -1);
  let streak = 0;
  while (days.has(cursor)) {
    streak++;
    cursor = addDays(cursor, -1);
  }
  return streak;
};
