import { LoggedSet, SessionExercise, SetTarget, WorkoutExercise } from '../models';

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

const workingSets = (sets: LoggedSet[]): LoggedSet[] => sets.filter(s => s.completed);

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
