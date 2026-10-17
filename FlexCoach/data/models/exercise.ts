import { BaseDocument, Id } from './common';

/**
 * How an exercise is measured, which drives what the logger asks for and
 * what the progression engine increases.
 *
 * - weight_reps:   barbell/dumbbell/machine lifts (weight + reps)
 * - reps:          bodyweight movements like pull ups (reps, optional added weight)
 * - time:          holds and carries like planks (duration, optional weight)
 * - distance_time: cardio like running or rowing (distance + duration)
 */
export type MeasurementType = 'weight_reps' | 'reps' | 'time' | 'distance_time';

export type MuscleGroup =
  | 'abdominals'
  | 'abductors'
  | 'adductors'
  | 'biceps'
  | 'calves'
  | 'chest'
  | 'forearms'
  | 'glutes'
  | 'hamstrings'
  | 'lats'
  | 'lower back'
  | 'middle back'
  | 'neck'
  | 'quadriceps'
  | 'shoulders'
  | 'traps'
  | 'triceps';

export type Equipment =
  | 'barbell'
  | 'dumbbell'
  | 'cable'
  | 'machine'
  | 'kettlebells'
  | 'bands'
  | 'medicine ball'
  | 'exercise ball'
  | 'foam roll'
  | 'e-z curl bar'
  | 'body only'
  | 'other';

export type ExerciseCategory =
  | 'strength'
  | 'stretching'
  | 'plyometrics'
  | 'powerlifting'
  | 'olympic weightlifting'
  | 'strongman'
  | 'cardio';

export type ExerciseLevel = 'beginner' | 'intermediate' | 'expert';

/**
 * An exercise definition. Catalog exercises are bundled with the app and are
 * read-only; custom exercises are created by a user and stored under their
 * account. Both share this shape so the rest of the app never cares which
 * kind it is holding.
 */
export interface Exercise {
  id: Id;
  name: string;
  measurement: MeasurementType;
  primaryMuscles: MuscleGroup[];
  secondaryMuscles: MuscleGroup[];
  equipment: Equipment | null;
  category: ExerciseCategory;
  level: ExerciseLevel | null;
  instructions: string[];
  /** Fully qualified image URLs, in order (start position, end position). Empty for the animated library. */
  images: string[];
  /** The exercise in motion, hosted: the GIF plays on iOS, the WebP on Android. */
  animation?: { gif: string; webp: string };
  /** A sentence on what the exercise is. */
  description?: string | null;
  /** Other names people call it, searchable. */
  aliases?: string[];
  /** The library's coarse region: chest, back, upper arms, waist, upper legs, lower legs, shoulders, lower arms, neck, cardio. */
  bodyPart?: string;
  /** One side at a time. */
  unilateral?: boolean;
  /** Curated links to other catalog exercises, by id. */
  relations?: { similar: string[]; substitutions: string[]; progressions: string[]; regressions: string[] };
  /** Video tutorial URL, if one exists. */
  videoUrl: string | null;
  /** 'catalog' for bundled exercises, 'custom' for user-created ones. */
  source: 'catalog' | 'custom';
}

/** A user-created exercise, stored at users/{uid}/customExercises/{id}. */
export interface CustomExercise extends Exercise, BaseDocument {
  source: 'custom';
  ownerId: Id;
  /** Soft delete so historical sessions can still resolve the name. */
  archivedAt: number | null;
}
