import { Exercise, ExerciseKind } from '../models';

export type { ExerciseKind };

/**
 * What an exercise is for planning (v1 #10, owner 2026-11-07): strength,
 * stretching or cardio. A workout holds one kind, and its picker only offers
 * that kind; cardio is added to a plan on its own.
 *
 * - Stretching: the catalog's Stretching type.
 * - Cardio: a Cardio-type exercise measured by distance and time, so the runs,
 *   rides, machines and swimming.
 * - Strength: everything else. That takes in plyometrics, powerlifting,
 *   Olympic lifting and strongman, and the conditioning drills the catalog files
 *   as cardio (burpees, jump rope, battle ropes, HIIT, the running drills done
 *   in place, Prowler Sprint): the owner put them with strength.
 */
/** Cardio-type exercises logged by distance that are drills, not a run or a machine. Ids from both libraries. */
const DRILLS = new Set([
  '3638', // Alternating Knee-Drive Front-Kick Run
  '3197', // Prancing Running Drill
  '3196', // Quick-Feet Run in Place
  '3656', // Short-Stride Run
  '3637', // Wheel Running Drill
  'Prowler_Sprint',
  'Rope_Jumping',
]);

/** An old-library exercise offered in the picker carries a `legacy:` prefix on its own id. */
const baseId = (id: string): string => id.replace(/^legacy:/, '');

export const exerciseKind = (exercise: Pick<Exercise, 'id' | 'category' | 'measurement'>): ExerciseKind => {
  if (exercise.category === 'stretching') return 'stretching';
  if (exercise.category === 'cardio' && exercise.measurement === 'distance_time' && !DRILLS.has(baseId(exercise.id))) return 'cardio';
  return 'strength';
};
