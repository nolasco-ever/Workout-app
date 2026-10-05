import { BaseDocument, Id, LocalDate, Timestamp } from './common';

/**
 * - scheduled:   upcoming, or today and not yet started
 * - in_progress: a session has been started for it
 * - completed:   the session was finished
 * - skipped:     the user chose to skip, or it was pushed past the cycle end
 * - rest:        a rest day (never changes)
 */
export type OccurrenceStatus = 'scheduled' | 'in_progress' | 'completed' | 'skipped' | 'rest';

/** 'missed': skipped by the app because a later workout was missed too and only the latest is asked about. */
export type SkipReason = 'user' | 'pushed_out' | 'cycle_ended' | 'missed';

/**
 * One planned day inside a cycle. Occurrences are materialised when the cycle
 * is created so that pushes and skips are simple date edits rather than rule
 * changes, and so the end-of-cycle summary can be computed from them.
 */
export interface Occurrence {
  id: Id;
  workoutId: Id | null;
  workoutName: string | null;
  /** The date this occurrence currently sits on. */
  date: LocalDate;
  /** The date it was originally generated for. */
  originalDate: LocalDate;
  status: OccurrenceStatus;
  pushCount: number;
  skipReason: SkipReason | null;
  sessionId: Id | null;
  /** When the in-app "you missed this" sheet was shown for it; shown once. */
  missedPromptedAt?: Timestamp | null;
}

export type CycleStatus = 'active' | 'completed';

/** Stored at users/{uid}/cycles/{cycleId}. Occurrences are embedded. */
export interface Cycle extends BaseDocument {
  ownerId: Id;
  planId: Id;
  /** 1-based index of this cycle within the plan. */
  number: number;
  startDate: LocalDate;
  /** For rotation plans this can move later when workouts are pushed. */
  endDate: LocalDate;
  status: CycleStatus;
  occurrences: Occurrence[];
  /** When the cycle report is available: stamped two hours after the last workout is resolved (see engine/cycleReport). */
  reportReadyAt?: Timestamp | null;
  /** When the owner first opened the report; the next cycle can't start before. */
  reportReviewedAt?: Timestamp | null;
  /** When the "report is ready" modal was shown, so it shows once. */
  reportPromptedAt?: Timestamp | null;
}

/** Computed at the end of a cycle for the "sprint review" screen. */
export interface CycleSummary {
  cycleId: Id;
  planId: Id;
  number: number;
  startDate: LocalDate;
  endDate: LocalDate;
  totalWorkouts: number;
  completed: number;
  /** Completed on the originally scheduled date. */
  completedOnTime: number;
  pushed: number;
  skipped: number;
  /** 0..1 */
  completionRate: number;
  personalRecords: PersonalRecord[];
}

export interface PersonalRecord {
  exerciseId: Id;
  exerciseName: string;
  kind: 'weight' | 'reps' | 'duration' | 'distance';
  value: number;
  previousValue: number | null;
  sessionId: Id;
  date: LocalDate;
}
