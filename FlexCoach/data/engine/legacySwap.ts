import { canonicalExerciseId } from '../catalog/exerciseIds';
import { Exercise, Id, LegacySwap, MeasurementType, Plan, Session } from '../models';
import { findPersonalRecords } from './stats';

/**
 * Legacy Swap (v1 #6b, owner 2026-10-26): a temporary fix for the move to
 * the new exercise library, which matched some exercises wrong. An exercise
 * is swapped for the one the lifter actually does, and its history goes with
 * it: every past workout that logged it now logs the new one, so records,
 * charts and targets follow. History belongs to the exercise, not a plan; the
 * active plan changes only when the lifter says so, other plans never.
 * Each swap keeps what it changed, so Undo puts it back. Pure.
 */

/** One exercise as the lifter has it: everything logged under the same exercise, whichever id it was stored with. */
export interface SwappableExercise {
  /** The canonical id the history is grouped by. */
  key: Id;
  /** The id to show it by (its catalog name and muscles). */
  exerciseId: Id;
  /** What the app calls it now: the match stands until the lifter swaps it (owner 2026-10-27). */
  name: string;
  measurement: MeasurementType;
  /** Finished workouts that logged it. */
  workouts: number;
  /** Every stored id it goes by, for the "originally added" suggestion. */
  storedIds: Id[];
  inActivePlan: boolean;
}

const sameKey = (id: Id, key: Id) => canonicalExerciseId(id) === key;

/** Every exercise with logged sets, most logged first (owner 2026-10-27: one with no history has nothing to swap). */
export const swappableExercises = (history: Session[], activePlan: Plan | null, nameOf: (id: Id, stored: string) => string): SwappableExercise[] => {
  const out = new Map<Id, SwappableExercise>();
  for (const s of history) {
    if (s.status !== 'completed') continue;
    const seen = new Set<Id>();
    for (const ex of s.exercises) {
      if (!ex.sets.some(st => st.completed)) continue;
      const key = canonicalExerciseId(ex.exerciseId);
      let e = out.get(key);
      if (!e) {
        e = { key, exerciseId: ex.exerciseId, name: nameOf(ex.exerciseId, ex.exerciseName), measurement: ex.measurement, workouts: 0, storedIds: [], inActivePlan: false };
        out.set(key, e);
      }
      if (!e.storedIds.includes(ex.exerciseId)) e.storedIds.push(ex.exerciseId);
      if (!seen.has(key)) e.workouts += 1;
      seen.add(key);
    }
  }
  for (const w of activePlan?.workouts ?? []) {
    for (const entry of w.exercises) {
      const e = out.get(canonicalExerciseId(entry.exerciseId));
      if (e) e.inActivePlan = true;
    }
  }
  return [...out.values()].sort((a, b) => b.workouts - a.workouts || a.name.localeCompare(b.name));
};

/** What a swap would carry over: the workouts and the records set along the way. */
export const swapReach = (history: Session[], key: Id): { workouts: number; records: number } => {
  const completed = history.filter(s => s.status === 'completed');
  const workouts = completed.filter(s => s.exercises.some(ex => sameKey(ex.exerciseId, key) && ex.sets.some(st => st.completed))).length;
  const records = findPersonalRecords(completed, []).filter(r => r.exerciseId === key).length;
  return { workouts, records };
};

/**
 * The swap: every logged exercise under `key` becomes `to`, and, when asked, every entry of it in the active plan.
 * Returns the sessions and plan to save, and the record that undoes it.
 */
export const applySwap = (args: {
  history: Session[];
  key: Id;
  from: { id: Id; name: string };
  to: Exercise;
  activePlan: Plan | null;
  replaceInPlan: boolean;
  id: Id;
  now: number;
}): { sessions: Session[]; plan: Plan | null; swap: LegacySwap } => {
  const { history, key, from, to, activePlan, replaceInPlan, id, now } = args;
  const swap: LegacySwap = { id, at: now, from, to: { id: to.id, name: to.name }, sessions: [], plan: null };
  const sessions: Session[] = [];
  for (const s of history) {
    if (!s.exercises.some(ex => sameKey(ex.exerciseId, key))) continue;
    sessions.push({
      ...s,
      exercises: s.exercises.map(ex => {
        if (!sameKey(ex.exerciseId, key)) return ex;
        swap.sessions.push({ sessionId: s.id, sessionExerciseId: ex.id, exerciseId: ex.exerciseId, exerciseName: ex.exerciseName });
        return { ...ex, exerciseId: to.id, exerciseName: to.name };
      }),
    });
  }
  let plan: Plan | null = null;
  if (replaceInPlan && activePlan && activePlan.workouts.some(w => w.exercises.some(e => sameKey(e.exerciseId, key)))) {
    const entries: NonNullable<LegacySwap['plan']>['entries'] = [];
    plan = {
      ...activePlan,
      workouts: activePlan.workouts.map(w => ({
        ...w,
        exercises: w.exercises.map(e => {
          if (!sameKey(e.exerciseId, key)) return e;
          entries.push({ workoutId: w.id, entryId: e.id, exerciseId: e.exerciseId, exerciseName: e.exerciseName });
          return { ...e, exerciseId: to.id, exerciseName: to.name };
        }),
      })),
    };
    swap.plan = { planId: activePlan.id, entries };
  }
  return { sessions, plan, swap };
};

/**
 * Undo: each logged exercise and plan entry the swap changed goes back to what it was, unless it has changed again
 * since (a later swap moved it on), which is left alone.
 */
export const undoSwap = (swap: LegacySwap, history: Session[], plans: Plan[]): { sessions: Session[]; plan: Plan | null } => {
  const bySession = new Map<Id, LegacySwap['sessions']>();
  for (const c of swap.sessions) bySession.set(c.sessionId, [...(bySession.get(c.sessionId) ?? []), c]);
  const sessions: Session[] = [];
  for (const s of history) {
    const changes = bySession.get(s.id);
    if (!changes) continue;
    let touched = false;
    const exercises = s.exercises.map(ex => {
      const c = changes.find(x => x.sessionExerciseId === ex.id);
      if (!c || ex.exerciseId !== swap.to.id) return ex;
      touched = true;
      return { ...ex, exerciseId: c.exerciseId, exerciseName: c.exerciseName };
    });
    if (touched) sessions.push({ ...s, exercises });
  }
  let plan: Plan | null = null;
  const original = swap.plan ? plans.find(p => p.id === swap.plan!.planId) : undefined;
  if (swap.plan && original) {
    let touched = false;
    const next = {
      ...original,
      workouts: original.workouts.map(w => ({
        ...w,
        exercises: w.exercises.map(e => {
          const c = swap.plan!.entries.find(x => x.workoutId === w.id && x.entryId === e.id);
          if (!c || e.exerciseId !== swap.to.id) return e;
          touched = true;
          return { ...e, exerciseId: c.exerciseId, exerciseName: c.exerciseName };
        }),
      })),
    };
    if (touched) plan = next;
  }
  return { sessions, plan };
};
