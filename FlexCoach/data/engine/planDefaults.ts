import { DEFAULT_PROGRESSION, Exercise, GOAL_DEFAULTS, PlanGoal, ProgressionConfig, WeightUnit, WorkoutExercise } from '../models';
import { newId } from './ids';
import { lbToKg } from './units';

/** Defaults for a new plan entry; pure, so the session engine can share them. */

/** The stock weight step: 5 lb for people who think in pounds, 2.5 kg otherwise. */
export const defaultProgression = (unit: WeightUnit): ProgressionConfig => ({
  ...DEFAULT_PROGRESSION,
  weightIncrementKg: unit === 'lb' ? lbToKg(5) : DEFAULT_PROGRESSION.weightIncrementKg,
});

/** Build an entry for a catalog exercise using the plan's goal defaults. */
export const newEntry = (exercise: Exercise, order: number, goal: PlanGoal | null, unit: WeightUnit = 'lb'): WorkoutExercise => {
  const d = GOAL_DEFAULTS[goal ?? 'hypertrophy'];
  const timed = exercise.measurement === 'time';
  const cardio = exercise.measurement === 'distance_time';
  return {
    id: newId(),
    exerciseId: exercise.id,
    exerciseName: exercise.name,
    measurement: exercise.measurement,
    order,
    sets: timed || cardio ? 1 : d.sets,
    repRangeMin: timed || cardio ? null : d.repRangeMin,
    repRangeMax: timed || cardio ? null : d.repRangeMax,
    startingWeightKg: null,
    // No stock time or distance: a target is set in the plan editor or earned from the first logged effort.
    startingDurationSec: null,
    startingDistanceM: null,
    restSec: d.restSec,
    progression: defaultProgression(unit),
    notes: null,
  };
};

/**
 * A plan entry swapped for another exercise in the plan editor (owner, 2026-10-24): same place in the workout, and,
 * when the two are measured the same way, the same sets, rep range, rest, progression steps and warm-up choice. The
 * starting weight is the old exercise's, so it is not carried; the entry gets a new id, so the old exercise's history
 * is not judged against the new one.
 */
export const swapEntry = (entry: WorkoutExercise, exercise: Exercise, goal: PlanGoal | null, unit: WeightUnit = 'lb'): WorkoutExercise => {
  const fresh = newEntry(exercise, entry.order, goal, unit);
  if (fresh.measurement !== entry.measurement) return fresh;
  return {
    ...fresh,
    sets: entry.sets,
    repRangeMin: entry.repRangeMin,
    repRangeMax: entry.repRangeMax,
    restSec: entry.restSec,
    progression: entry.progression,
    ...(entry.warmup !== undefined ? { warmup: entry.warmup } : {}),
  };
};
