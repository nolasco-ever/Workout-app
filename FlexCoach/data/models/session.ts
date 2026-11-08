import { BaseDocument, Id, LocalDate, Timestamp } from './common';
import { ExerciseKind, MeasurementType } from './exercise';

/**
 * What the app suggested for an exercise before the session started. Stored
 * on the session so "suggested versus actual" can be shown later and so the
 * next suggestion knows what the last target was.
 */
export interface SetTarget {
  sets: number;
  /** Headline reps and weight: the first working set's, when sets differ. */
  reps: number | null;
  weightKg: number | null;
  durationSec: number | null;
  distanceM: number | null;
  /**
   * Per working set, when a lifter ramps (25, 30, 35) or only some sets
   * progressed. Missing on targets set before per-set progression, and for
   * timed and cardio exercises; the headline applies to every set then.
   */
  perSet?: SetGoal[];
}

export interface SetGoal {
  weightKg: number | null;
  reps: number | null;
}

/** One logged set. Which fields are used depends on the exercise measurement. */
export interface LoggedSet {
  id: Id;
  setNumber: number;
  weightKg: number | null;
  reps: number | null;
  durationSec: number | null;
  distanceM: number | null;
  completed: boolean;
  completedAt: Timestamp | null;
  /**
   * A lighter set done before the working sets, built from the first working
   * set's weight when the session starts. Never counts toward volume,
   * records or progression. Missing on sets logged before warm-ups existed.
   */
  warmup?: boolean;
  /** Cardio: the distance was measured by the Apple Watch (v1 #6, step 3), until it is typed over. */
  distanceSource?: 'watch';
  /** Cardio: numbers read off the machine's console (v1 #10.7). Absent with no scan. */
  scan?: ConsoleScan;
  /** Outdoor cardio: the path taken (v1 #10.8), an encoded polyline, from the phone's GPS or the Watch's. Absent indoors. */
  route?: { line: string; source: 'phone' | 'watch' };
}

/**
 * What a console scan put on a cardio entry (v1 #10.7). A scanned distance is
 * also the entry's `distanceM`, so History and records use it; the distance it
 * replaced is kept to be put back when the scanned one is removed. Scanned
 * calories show in place of the Watch's. Each field is absent when not scanned.
 */
export interface ConsoleScan {
  distanceM?: number;
  kcal?: number;
  /** Meters a second. */
  speedMps?: number;
  /** The entry's distance and its source before the scan. */
  prior?: { distanceM: number | null; watch: boolean };
}

export interface SessionExercise {
  id: Id;
  /** Links back to the plan entry, if the session came from a plan. */
  workoutExerciseId: Id | null;
  exerciseId: Id;
  exerciseName: string;
  measurement: MeasurementType;
  order: number;
  target: SetTarget;
  sets: LoggedSet[];
  notes: string | null;
  /** Set when this exercise replaced the plan's one for this session only. */
  substitutedFor?: { exerciseId: Id; exerciseName: string };
}

export type SessionStatus = 'in_progress' | 'completed' | 'abandoned';

/**
 * Stored at users/{uid}/sessions/{sessionId}. Sets are embedded and the
 * document is updated after every set so a killed app loses nothing.
 */
export interface Session extends BaseDocument {
  ownerId: Id;
  planId: Id | null;
  cycleId: Id | null;
  occurrenceId: Id | null;
  workoutId: Id | null;
  workoutName: string;
  date: LocalDate;
  startedAt: Timestamp;
  finishedAt: Timestamp | null;
  status: SessionStatus;
  exercises: SessionExercise[];
  /** What the Apple Watch measured over the workout, when one tracked it (v1 #6); absent otherwise. */
  watch?: WatchMetrics | null;
  /** A quick workout's kind, picked as it starts (v1 #10); its picker only offers that kind. Absent otherwise and on older sessions. */
  kind?: ExerciseKind;
}

/** The Watch's Health workout, summed up: active calories, and heart rate over the workout. */
export interface WatchMetrics {
  kcal: number;
  avgBpm: number | null;
  maxBpm: number | null;
}
