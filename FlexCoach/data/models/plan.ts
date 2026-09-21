import { BaseDocument, Id, Weekday } from './common';
import { MeasurementType } from './exercise';

/**
 * Progression settings for one exercise entry in a workout. All weights are
 * stored in kilograms; the UI converts to the user's preferred unit.
 */
export interface ProgressionConfig {
  /** How much to add when every set hits the top of the rep range. */
  weightIncrementKg: number;
  /** Reps to add per successful session while climbing back to the top. */
  repStep: number;
  /** Seconds to add per successful session for timed exercises. */
  durationStepSec: number;
  /** Metres to add per completed session for cardio. 0 disables. */
  distanceStepM: number;
}

/**
 * The prescription for one exercise inside a workout. `repRangeMin` and
 * `repRangeMax` define the double-progression window: reps climb from the
 * bottom to the top of the range, then weight goes up and reps reset.
 */
export interface WorkoutExercise {
  id: Id;
  exerciseId: Id;
  /** Snapshot so the plan still reads correctly if the exercise is archived. */
  exerciseName: string;
  measurement: MeasurementType;
  order: number;
  sets: number;
  repRangeMin: number | null;
  repRangeMax: number | null;
  /** Starting weight when there is no history yet. Null means "user enters". */
  startingWeightKg: number | null;
  /** Starting duration for timed exercises. */
  startingDurationSec: number | null;
  /** Starting distance for cardio. */
  startingDistanceM: number | null;
  /** Rest between sets, for the rest timer. */
  restSec: number;
  progression: ProgressionConfig;
  notes: string | null;
}

/** One training day template, e.g. "Push" or "Full Body A". */
export interface Workout {
  id: Id;
  name: string;
  order: number;
  exercises: WorkoutExercise[];
}

/**
 * Rotation scheduling: the plan repeats an ordered list of slots day after
 * day regardless of weekday. A null slot is a rest day. "Push, Pull, Legs,
 * Rest" is a 4-slot rotation. One cycle is `passesPerCycle` trips through the
 * list. Pushing a missed workout shifts the rest of the cycle forward.
 */
export interface RotationSchedule {
  mode: 'rotation';
  slots: (Id | null)[];
  passesPerCycle: number;
}

/**
 * Weekly scheduling: workouts are pinned to weekdays. One cycle is
 * `weeksPerCycle` weeks starting on `startWeekday`. Pushing a missed workout
 * shifts within the cycle only; the next cycle always regenerates fresh, so
 * Monday stays Monday.
 */
export interface WeeklySchedule {
  mode: 'weekly';
  /** Workout id per weekday (index 0 = Sunday). Null is a rest day. */
  weekdays: [Id | null, Id | null, Id | null, Id | null, Id | null, Id | null, Id | null];
  startWeekday: Weekday;
  weeksPerCycle: number;
}

export type Schedule = RotationSchedule | WeeklySchedule;

export type PlanStatus = 'draft' | 'active' | 'archived';

/** Stored at users/{uid}/plans/{planId}. Workouts are embedded. */
export interface Plan extends BaseDocument {
  ownerId: Id;
  name: string;
  description: string | null;
  status: PlanStatus;
  workouts: Workout[];
  schedule: Schedule;
  /** Set when this plan was copied from a buddy's plan. */
  sharedFrom: { userId: Id; planId: Id; sharedAt: number } | null;
  archivedAt: number | null;
}

export const DEFAULT_PROGRESSION: ProgressionConfig = {
  weightIncrementKg: 2.5,
  repStep: 1,
  durationStepSec: 10,
  distanceStepM: 0,
};
