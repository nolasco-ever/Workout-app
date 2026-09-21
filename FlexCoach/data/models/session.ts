import { BaseDocument, Id, LocalDate, Timestamp } from './common';
import { MeasurementType } from './exercise';

/**
 * What the app suggested for an exercise before the session started. Stored
 * on the session so "suggested versus actual" can be shown later and so the
 * next suggestion knows what the last target was.
 */
export interface SetTarget {
  sets: number;
  reps: number | null;
  weightKg: number | null;
  durationSec: number | null;
  distanceM: number | null;
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
}
