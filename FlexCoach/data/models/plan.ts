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
  /**
   * Add warm-up sets before the working sets, scaled from the first working
   * set's weight. Missing on entries made before the option existed, which
   * reads as on for weighted lifts (see wantsWarmup).
   */
  warmup?: boolean;
}

/** Whether a plan entry gets warm-up sets: on by default for weighted lifts only. */
export const wantsWarmup = (entry: Pick<WorkoutExercise, 'measurement' | 'warmup'>): boolean =>
  entry.measurement === 'weight_reps' && entry.warmup !== false;

/**
 * What a workout holds (v1 #10): its exercise picker only offers this kind.
 * 'cardio' is a cardio item, added to a plan on its own: exactly one cardio
 * exercise, named after it, never shown or called a workout (owner, 2026-11-07).
 * It is a workout underneath so scheduling, sessions and history need no second path.
 */
export type WorkoutType = 'strength' | 'stretching' | 'cardio';

/** One training day template, e.g. "Push" or "Full Body A". */
export interface Workout {
  id: Id;
  name: string;
  order: number;
  exercises: WorkoutExercise[];
  /** Missing on workouts made before types: their picker offers everything until the plan split types them. */
  type?: WorkoutType;
}

/**
 * What one day of the schedule holds: workout ids (cardio items included), in
 * the order they're listed. Several are done as separate sessions, in any
 * order (v1 #10). An empty day is a rest day. Plans saved before this held a
 * single id or null per day; `normalizeSchedule` reads those.
 */
export type ScheduleDay = Id[];

/**
 * Rotation scheduling: the plan repeats an ordered list of slots day after
 * day regardless of weekday. An empty slot is a rest day. "Push, Pull, Legs,
 * Rest" is a 4-slot rotation. One cycle is `passesPerCycle` trips through the
 * list. Pushing a missed day shifts the rest of the cycle forward.
 */
export interface RotationSchedule {
  mode: 'rotation';
  slots: ScheduleDay[];
  passesPerCycle: number;
}

/**
 * Weekly scheduling: workouts are pinned to weekdays. One cycle is
 * `weeksPerCycle` weeks starting on `startWeekday`. Pushing a missed day
 * shifts within the cycle only; the next cycle always regenerates fresh, so
 * Monday stays Monday.
 */
export interface WeeklySchedule {
  mode: 'weekly';
  /** What each weekday holds (index 0 = Sunday). Empty is a rest day. */
  weekdays: [ScheduleDay, ScheduleDay, ScheduleDay, ScheduleDay, ScheduleDay, ScheduleDay, ScheduleDay];
  startWeekday: Weekday;
  weeksPerCycle: number;
}

export type Schedule = RotationSchedule | WeeklySchedule;

/** 'draft' also covers a finished plan that is simply not the active one. */
export type PlanStatus = 'draft' | 'active' | 'archived';

/** Sets the default sets and rep range for exercises added to the plan. */
export type PlanGoal = 'strength' | 'hypertrophy' | 'endurance';

export const GOAL_DEFAULTS: Record<PlanGoal, { sets: number; repRangeMin: number; repRangeMax: number; restSec: number }> = {
  strength: { sets: 4, repRangeMin: 4, repRangeMax: 6, restSec: 150 },
  hypertrophy: { sets: 3, repRangeMin: 8, repRangeMax: 12, restSec: 90 },
  endurance: { sets: 3, repRangeMin: 12, repRangeMax: 15, restSec: 60 },
};

/** One thing that moved, for the plan split Notice. */
export interface SplitMove {
  kind: 'cardio' | 'stretching';
  /** The new item's name. */
  name: string;
  /** The workout it came out of. */
  from: string;
  /** Where it sits next to that workout; 'instead' when the workout was only cardio and is gone. */
  place: 'before' | 'after' | 'instead';
  /** The new item's id, and the days it is on ("Mon", "Day 2"). */
  id: Id;
  days: string[];
}

/** Stored at users/{uid}/plans/{planId}. Workouts are embedded. */
export interface Plan extends BaseDocument {
  ownerId: Id;
  name: string;
  description: string | null;
  status: PlanStatus;
  goal: PlanGoal | null;
  workouts: Workout[];
  schedule: Schedule;
  /**
   * Set when this plan came from a buddy's plan. A plain copy is
   * independent. A synced one (`synced: true`) follows the buddy's edits:
   * the app watches their plan and applies changes with the same rules as
   * editing your own active plan. It turns back into a plain copy when the
   * buddy deletes, archives or un-shares it, or when you stop syncing.
   * `sourceUpdatedAt` is the buddy's plan version last applied.
   */
  sharedFrom: { userId: Id; planId: Id; sharedAt: number; displayName?: string | null; synced?: boolean; sourceUpdatedAt?: number } | null;
  archivedAt: number | null;
  /** Buddies can see and copy this plan. Off by default; missing on older plans. */
  visibleToBuddies?: boolean;
  /**
   * Set once the plan has been split (v1 #10.11): when, what moved (for the
   * Notice), and the plan as it was before, as JSON (kept as a backup; a string
   * so its schedule's lists never sit inside a list in Firestore). Missing on
   * plans not split yet, and on plans made since.
   */
  split?: { at: number; moves: SplitMove[]; backup?: string };
}

export const DEFAULT_PROGRESSION: ProgressionConfig = {
  weightIncrementKg: 2.5,
  repStep: 1,
  durationStepSec: 10,
  distanceStepM: 0,
};
