import { Cycle, Id, LoggedSet, MeasurementType, Plan, Session, SessionExercise, SetGoal, SetTarget, WeightUnit, WorkoutExercise } from '../models';
import { workingSets } from './sets';
import { KG_PER_LB } from './units';

/**
 * Double progression, judged once per cycle.
 *
 * Targets are fixed for a whole cycle. When the cycle ends, every session
 * of an exercise in it is looked at together and the next cycle's targets
 * come out of that, set by set:
 *
 * - Every session hit the target reps on this set, and the target was
 *   already the top of the range: weight goes up by the increment and the
 *   reps target drops to the bottom of the range. A heavier weight is not
 *   expected at the same reps straight away.
 * - Every session hit the target reps, target below the top: reps climb,
 *   to at least one step up and to whatever was managed every time.
 * - Any session missed: the reps target drops to the fewest reps managed
 *   (never below the bottom of the range), weight stays.
 * - Not trained in the cycle: everything stays.
 *
 * Sets progress independently, so someone who ramps 25, 30, 35 keeps
 * ramping instead of being pushed to 40 on every set. Bodyweight reps grow
 * past the top of the range instead of adding weight. Timed holds add a
 * step when every set of every session reached the target; cardio repeats
 * the last completed distance and duration plus the optional step.
 */

export type ProgressionChange = 'start' | 'hold' | 'increase' | 'climb' | 'drop';

export interface ExerciseProgression {
  workoutExerciseId: Id;
  exerciseId: Id;
  exerciseName: string;
  measurement: MeasurementType;
  /** The target the last cycle's sessions were judged against, if any. */
  from: SetTarget | null;
  /** The target for the coming cycle. */
  target: SetTarget;
  change: ProgressionChange;
  /** Sessions of this exercise in the judged cycle. */
  sessions: number;
  /** Of those, sessions where every working set hit its target. */
  hits: number;
}

const minOf = (values: (number | null | undefined)[]): number | null => {
  const nums = values.filter((v): v is number => typeof v === 'number');
  return nums.length ? Math.min(...nums) : null;
};

const maxOf = (values: (number | null | undefined)[]): number | null => {
  const nums = values.filter((v): v is number => typeof v === 'number');
  return nums.length ? Math.max(...nums) : null;
};

const roundTo = (value: number, step: number): number => Math.round(value / step) * step;

/**
 * Snap a stored weight to something that can actually be loaded in the
 * user's unit: 2.5 lb or 1.25 kg. Suggestions are computed in kilograms,
 * so without this a 5 lb increment lands on 55.5 lb.
 */
export const roundToLoadableKg = (kg: number, unit: WeightUnit): number => {
  if (unit === 'lb') return roundTo(kg / KG_PER_LB, 2.5) * KG_PER_LB;
  return roundTo(kg, 1.25);
};

/** The goal for working set `i`, falling back to the headline for older targets. */
export const goalFor = (target: SetTarget, i: number): SetGoal => target.perSet?.[i] ?? { weightKg: target.weightKg, reps: target.reps };

/** Collapse per-set goals into a target; the first set is the headline. */
const withPerSet = (sets: number, goals: SetGoal[]): SetTarget => {
  const uniform = goals.every(g => g.weightKg === goals[0].weightKg && g.reps === goals[0].reps);
  return {
    sets,
    reps: goals[0]?.reps ?? null,
    weightKg: goals[0]?.weightKg ?? null,
    durationSec: null,
    distanceM: null,
    ...(uniform ? {} : { perSet: goals }),
  };
};

const initialTarget = (entry: WorkoutExercise): SetTarget => ({
  sets: entry.sets,
  reps: entry.repRangeMax,
  weightKg: entry.startingWeightKg,
  durationSec: entry.startingDurationSec,
  distanceM: entry.startingDistanceM,
});

/** Carry a target forward unchanged, sized to the plan's current set count. */
const carry = (target: SetTarget, sets: number): SetTarget => {
  const goals = Array.from({ length: sets }, (_, i) => goalFor(target, Math.min(i, Math.max(0, (target.perSet?.length ?? target.sets) - 1))));
  return { ...withPerSet(sets, goals), durationSec: target.durationSec, distanceM: target.distanceM };
};

const summary = (entry: WorkoutExercise, from: SetTarget | null, target: SetTarget, change: ProgressionChange, sessions: number, hits: number): ExerciseProgression => ({
  workoutExerciseId: entry.id,
  exerciseId: entry.exerciseId,
  exerciseName: entry.exerciseName,
  measurement: entry.measurement,
  from,
  target,
  change,
  sessions,
  hits,
});

/**
 * Next cycle's target for one exercise.
 *
 * @param entry    the plan prescription
 * @param logs     this exercise's completed logs from the cycle being judged, oldest first
 * @param fallback the most recent earlier log of the exercise (any cycle or plan), when the cycle had none
 * @param unit     the user's weight unit, so an increase lands on a loadable number
 */
export const progressExercise = (entry: WorkoutExercise, logs: SessionExercise[], fallback: SessionExercise | null, unit: WeightUnit): ExerciseProgression => {
  const judged = logs.filter(l => workingSets(l.sets).length > 0);
  if (judged.length === 0) {
    const base = logs[logs.length - 1] ?? fallback;
    if (!base) return summary(entry, null, initialTarget(entry), 'start', 0, 0);
    return summary(entry, base.target, carry(base.target, entry.sets), 'hold', 0, 0);
  }

  const latest = judged[judged.length - 1];
  const from = latest.target;
  const p = entry.progression;
  const done = judged.map(l => workingSets(l.sets));

  switch (entry.measurement) {
    case 'weight_reps':
    case 'reps': {
      const rangeMin = entry.repRangeMin ?? 1;
      const rangeMax = entry.repRangeMax ?? rangeMin;
      const changes: ProgressionChange[] = [];
      const goals: SetGoal[] = [];
      for (let i = 0; i < entry.sets; i++) {
        const prev = goalFor(from, i);
        const targetReps = prev.reps ?? rangeMax;
        const attempts: (LoggedSet | undefined)[] = done.map(sets => sets[i]);
        const hit = attempts.every(s => s !== undefined && (s.reps ?? 0) >= targetReps);
        const lastWeight = maxOf([[...attempts].reverse().find(s => s !== undefined)?.weightKg]) ?? prev.weightKg ?? entry.startingWeightKg;
        const minReps = Math.min(...attempts.map(s => s?.reps ?? 0));

        if (!hit) {
          const reps = Math.max(rangeMin, Math.min(minReps, rangeMax));
          goals.push({ weightKg: lastWeight, reps });
          changes.push(reps < targetReps ? 'drop' : 'hold');
        } else if (targetReps < rangeMax) {
          const reps = Math.max(rangeMin, Math.min(rangeMax, Math.max(targetReps + p.repStep, minReps)));
          goals.push({ weightKg: lastWeight, reps });
          changes.push(reps > targetReps ? 'climb' : 'hold');
        } else {
          const canAddWeight = entry.measurement === 'weight_reps' || (lastWeight !== null && lastWeight > 0);
          if (canAddWeight && lastWeight !== null) {
            goals.push({ weightKg: roundToLoadableKg(lastWeight + p.weightIncrementKg, unit), reps: rangeMin });
            changes.push('increase');
          } else {
            goals.push({ weightKg: lastWeight, reps: rangeMax + p.repStep });
            changes.push('climb');
          }
        }
      }
      const change: ProgressionChange = changes.includes('increase') ? 'increase' : changes.includes('climb') ? 'climb' : changes.includes('drop') ? 'drop' : 'hold';
      const hits = judged.filter((_, j) => Array.from({ length: entry.sets }, (_, i) => done[j][i]).every((s, i) => s !== undefined && (s.reps ?? 0) >= (goalFor(from, i).reps ?? rangeMax))).length;
      return summary(entry, from, withPerSet(entry.sets, goals), change, judged.length, hits);
    }

    case 'time': {
      const targetSec = from.durationSec ?? entry.startingDurationSec ?? 30;
      const hitAll = done.every(sets => sets.length >= entry.sets && (minOf(sets.map(s => s.durationSec)) ?? 0) >= targetSec);
      const hits = done.filter(sets => sets.length >= entry.sets && (minOf(sets.map(s => s.durationSec)) ?? 0) >= targetSec).length;
      const minSec = minOf(done.flatMap(sets => sets.map(s => s.durationSec))) ?? 0;
      const weight = maxOf(done[done.length - 1].map(s => s.weightKg)) ?? from.weightKg;
      const durationSec = hitAll ? targetSec + p.durationStepSec : Math.max(5, minSec);
      const target: SetTarget = { sets: entry.sets, reps: null, weightKg: weight, durationSec, distanceM: null };
      return summary(entry, from, target, hitAll ? 'increase' : durationSec < targetSec ? 'drop' : 'hold', judged.length, hits);
    }

    case 'distance_time': {
      const last = done[done.length - 1];
      const lastDistance = maxOf(last.map(s => s.distanceM)) ?? from.distanceM ?? entry.startingDistanceM;
      const lastDuration = maxOf(last.map(s => s.durationSec)) ?? from.durationSec ?? entry.startingDurationSec;
      const target: SetTarget = {
        sets: entry.sets,
        reps: null,
        weightKg: null,
        durationSec: lastDuration,
        distanceM: lastDistance !== null ? lastDistance + p.distanceStepM : null,
      };
      return summary(entry, from, target, p.distanceStepM > 0 && lastDistance !== null ? 'increase' : 'hold', judged.length, judged.length);
    }
  }
};

/**
 * The cycle whose sessions decide this cycle's targets: the one this plan
 * trained most recently before this cycle began. Null for a plan's first
 * cycle (or when nothing was logged before).
 */
export const previousCycleId = (sessions: Session[], plan: Plan, cycle: Pick<Cycle, 'id' | 'createdAt'>): Id | null => {
  let latest: Session | null = null;
  for (const s of sessions) {
    if (s.status !== 'completed' || s.planId !== plan.id || !s.cycleId || s.cycleId === cycle.id || s.startedAt >= cycle.createdAt) continue;
    if (!latest || s.startedAt > latest.startedAt) latest = s;
  }
  return latest?.cycleId ?? null;
};

/**
 * Targets for every exercise in the plan, judged from the sessions of
 * `judgedCycleId`. With null, exercises start from the plan's values or
 * carry their last logged target forward.
 */
export const progressPlan = (plan: Plan, sessions: Session[], judgedCycleId: Id | null, unit: WeightUnit, before: number = Number.POSITIVE_INFINITY): ExerciseProgression[] => {
  const completed = sessions.filter(s => s.status === 'completed' && s.startedAt < before).sort((a, b) => a.startedAt - b.startedAt);
  const out: ExerciseProgression[] = [];
  for (const workout of plan.workouts) {
    for (const entry of workout.exercises) {
      const logs = judgedCycleId === null ? [] : completed.filter(s => s.cycleId === judgedCycleId).flatMap(s => s.exercises.filter(ex => ex.exerciseId === entry.exerciseId));
      let fallback: SessionExercise | null = null;
      for (let i = completed.length - 1; i >= 0 && !fallback; i--) {
        if (completed[i].cycleId === judgedCycleId) continue;
        fallback = completed[i].exercises.find(ex => ex.exerciseId === entry.exerciseId) ?? null;
      }
      out.push(progressExercise(entry, logs, fallback, unit));
    }
  }
  return out;
};

/** Targets for the sessions of `cycle`: what its previous cycle earned. */
export const targetsForCycle = (plan: Plan, cycle: Cycle, sessions: Session[], unit: WeightUnit): Map<Id, ExerciseProgression> =>
  new Map(progressPlan(plan, sessions, previousCycleId(sessions, plan, cycle), unit, cycle.createdAt).map(p => [p.workoutExerciseId, p]));

/** Build the empty set rows the logger shows when a session starts. */
export const buildPlannedSets = (target: SetTarget, makeId: () => string): LoggedSet[] =>
  Array.from({ length: target.sets }, (_, i) => {
    const goal = goalFor(target, i);
    return {
      id: makeId(),
      setNumber: i + 1,
      weightKg: goal.weightKg,
      reps: goal.reps,
      durationSec: target.durationSec,
      distanceM: target.distanceM,
      completed: false,
      completedAt: null,
    };
  });

/** "8" or "8–12": the reps a target asks for across its sets. */
export const targetRepsLabel = (target: SetTarget): string => {
  const reps = Array.from({ length: target.sets }, (_, i) => goalFor(target, i).reps).filter((r): r is number => r !== null);
  if (reps.length === 0) return '—';
  const lo = Math.min(...reps);
  const hi = Math.max(...reps);
  return lo === hi ? String(lo) : `${lo}–${hi}`;
};

/** The lightest and heaviest working-set weight a target asks for. */
export const targetWeightRange = (target: SetTarget): { min: number; max: number } | null => {
  const weights = Array.from({ length: target.sets }, (_, i) => goalFor(target, i).weightKg).filter((w): w is number => w !== null);
  if (weights.length === 0) return null;
  return { min: Math.min(...weights), max: Math.max(...weights) };
};

/**
 * Warm-up ramp for a weighted lift, as fractions of the first working
 * weight with the reps to do at each. Heavier working weights get a longer
 * ramp; anything under 20 kg (about 45 lb) is light enough to start cold.
 */
export const warmupRamp = (workingKg: number): { fraction: number; reps: number }[] => {
  if (workingKg >= 80) return [{ fraction: 0.4, reps: 8 }, { fraction: 0.6, reps: 5 }, { fraction: 0.8, reps: 3 }];
  if (workingKg >= 40) return [{ fraction: 0.5, reps: 8 }, { fraction: 0.75, reps: 4 }];
  if (workingKg >= 20) return [{ fraction: 0.5, reps: 8 }];
  return [];
};

/** Round a warm-up weight to what can actually be loaded in the user's unit: 5 lb or 2.5 kg. */
const roundWarmupKg = (kg: number, unit: WeightUnit): number => {
  if (unit === 'lb') return roundTo(kg / KG_PER_LB, 5) * KG_PER_LB;
  return roundTo(kg, 2.5);
};

/**
 * Warm-up sets to log before the working sets of a weighted lift, built
 * from the target's first working weight. Empty when there is no weight to
 * scale from or the working weight is light. Set numbers restart from 1
 * within the warm-ups.
 */
export const buildWarmupSets = (target: SetTarget, unit: WeightUnit, makeId: () => string): LoggedSet[] => {
  const w = goalFor(target, 0).weightKg;
  if (w === null || w <= 0) return [];
  return warmupRamp(w)
    .map(step => ({ kg: roundWarmupKg(w * step.fraction, unit), reps: step.reps }))
    // Rounding a light ramp can land on the working weight itself; no point warming up with it.
    .filter(step => step.kg > 0 && step.kg < w)
    .map((step, i) => ({
      id: makeId(),
      setNumber: i + 1,
      weightKg: step.kg,
      reps: step.reps,
      durationSec: null,
      distanceM: null,
      completed: false,
      completedAt: null,
      warmup: true,
    }));
};
