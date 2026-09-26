import { LoggedSet, SessionExercise, SetTarget, WeightUnit, WorkoutExercise } from '../models';
import { workingSets } from './sets';
import { KG_PER_LB } from './units';

/**
 * Double progression.
 *
 * Weighted lifts: reps climb from the bottom of the rep range to the top at a
 * fixed weight. Once every working set hits the top, weight goes up by the
 * configured increment and the target reps stay at the top. If the lifter
 * misses, the next target drops to what they actually managed (never below
 * the bottom of the range) and climbs back one step per successful session.
 *
 * Bodyweight reps: same rule, but with no weight to add the range itself
 * shifts upward when the top is reached.
 *
 * Timed: duration climbs by a fixed step on success; on a miss it drops to
 * the shortest completed hold.
 *
 * Cardio: repeats the last completed distance and duration, adding the
 * optional distance step. Cardio progression is deliberately conservative.
 */

const minOf = (values: (number | null)[]): number | null => {
  const nums = values.filter((v): v is number => typeof v === 'number');
  return nums.length ? Math.min(...nums) : null;
};

const maxOf = (values: (number | null)[]): number | null => {
  const nums = values.filter((v): v is number => typeof v === 'number');
  return nums.length ? Math.max(...nums) : null;
};

const roundTo = (value: number, step: number): number => Math.round(value / step) * step;

const initialTarget = (entry: WorkoutExercise): SetTarget => ({
  sets: entry.sets,
  reps: entry.repRangeMax,
  weightKg: entry.startingWeightKg,
  durationSec: entry.startingDurationSec,
  distanceM: entry.startingDistanceM,
});

/**
 * Suggest targets for the next session of an exercise.
 *
 * @param entry the plan prescription
 * @param last  the most recent logged session of this exercise, or null
 */
export const suggestTarget = (entry: WorkoutExercise, last: SessionExercise | null): SetTarget => {
  if (!last) return initialTarget(entry);
  const done = workingSets(last.sets);
  if (done.length === 0) return { ...last.target, sets: entry.sets };

  const lastTarget = last.target;
  const p = entry.progression;

  switch (entry.measurement) {
    case 'weight_reps':
    case 'reps': {
      const rangeMin = entry.repRangeMin ?? 1;
      const rangeMax = entry.repRangeMax ?? rangeMin;
      const targetReps = lastTarget.reps ?? rangeMax;
      const weight = maxOf(done.map(s => s.weightKg)) ?? lastTarget.weightKg ?? entry.startingWeightKg;
      const minReps = minOf(done.map(s => s.reps)) ?? 0;
      const allSetsDone = done.length >= entry.sets;
      const hitTarget = allSetsDone && minReps >= targetReps;

      if (!hitTarget) {
        // Missed: drop to what was achieved, but never below the range floor.
        return {
          sets: entry.sets,
          reps: Math.max(rangeMin, Math.min(minReps, rangeMax)),
          weightKg: weight,
          durationSec: null,
          distanceM: null,
        };
      }

      if (targetReps < rangeMax) {
        // Climbing back up the range.
        return {
          sets: entry.sets,
          reps: Math.min(rangeMax, targetReps + p.repStep),
          weightKg: weight,
          durationSec: null,
          distanceM: null,
        };
      }

      // Top of the range on every set.
      const canAddWeight = entry.measurement === 'weight_reps' || (weight !== null && weight > 0);
      if (canAddWeight && weight !== null) {
        return {
          sets: entry.sets,
          reps: rangeMax,
          weightKg: roundTo(weight + p.weightIncrementKg, 0.25),
          durationSec: null,
          distanceM: null,
        };
      }
      // Pure bodyweight: keep growing reps.
      return {
        sets: entry.sets,
        reps: rangeMax + p.repStep,
        weightKg: weight,
        durationSec: null,
        distanceM: null,
      };
    }

    case 'time': {
      const targetSec = lastTarget.durationSec ?? entry.startingDurationSec ?? 30;
      const minSec = minOf(done.map(s => s.durationSec)) ?? 0;
      const weight = maxOf(done.map(s => s.weightKg)) ?? lastTarget.weightKg;
      const hit = done.length >= entry.sets && minSec >= targetSec;
      return {
        sets: entry.sets,
        reps: null,
        weightKg: weight,
        durationSec: hit ? targetSec + p.durationStepSec : Math.max(5, minSec),
        distanceM: null,
      };
    }

    case 'distance_time': {
      const lastDistance = maxOf(done.map(s => s.distanceM)) ?? lastTarget.distanceM ?? entry.startingDistanceM;
      const lastDuration = maxOf(done.map(s => s.durationSec)) ?? lastTarget.durationSec ?? entry.startingDurationSec;
      return {
        sets: entry.sets,
        reps: null,
        weightKg: null,
        durationSec: lastDuration,
        distanceM: lastDistance !== null ? lastDistance + p.distanceStepM : null,
      };
    }
  }
};

/** Build the empty set rows the logger shows when a session starts. */
export const buildPlannedSets = (target: SetTarget, makeId: () => string): LoggedSet[] =>
  Array.from({ length: target.sets }, (_, i) => ({
    id: makeId(),
    setNumber: i + 1,
    weightKg: target.weightKg,
    reps: target.reps,
    durationSec: target.durationSec,
    distanceM: target.distanceM,
    completed: false,
    completedAt: null,
  }));

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
 * from the target's weight. Empty when there is no weight to scale from or
 * the working weight is light. Set numbers restart from 1 within the warm-ups.
 */
export const buildWarmupSets = (target: SetTarget, unit: WeightUnit, makeId: () => string): LoggedSet[] => {
  const w = target.weightKg;
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
