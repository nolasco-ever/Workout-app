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
