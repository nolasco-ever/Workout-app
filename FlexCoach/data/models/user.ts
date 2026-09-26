import { BaseDocument, DistanceUnit, Id, LocalDate, Timestamp, WeightUnit } from './common';
import { NotificationPrefs } from './notification';

export type AuthProvider = 'password' | 'apple' | 'google';

/** Stored at users/{uid}. Private to the owner. */
export interface UserProfile extends BaseDocument {
  displayName: string | null;
  email: string | null;
  photoUrl: string | null;
  authProvider: AuthProvider;
  weightUnit: WeightUnit;
  distanceUnit: DistanceUnit;
  activePlanId: Id | null;
  activeCycleId: Id | null;
  /** Optional goal shown as a line on the body weight chart. */
  targetWeightKg: number | null;
  /** When the user granted health-store access; null means not connected. */
  healthConnectedAt: Timestamp | null;
  onboardingCompletedAt: Timestamp | null;
  /** Missing on profiles created before notifications existed; see withPrefDefaults. */
  notifications?: Partial<NotificationPrefs> | null;
  /**
   * When the OS notification prompt was first shown. Android reports only
   * granted or denied, so this is how "never asked" is told apart from
   * "asked and refused" there.
   */
  notificationsPromptedAt?: Timestamp | null;
  /** The code on this account's Iron Card (see inviteCodes); made on first visit to Buddies. */
  inviteCode?: string | null;
}

/** The single best lift on record, for the card. */
export interface BestRecord {
  exerciseName: string;
  kind: 'weight' | 'reps' | 'duration' | 'distance';
  value: number;
}

/**
 * Stored at publicProfiles/{uid}: the "Iron Card". This is the only document
 * a buddy can read about someone, refreshed whenever a session completes or
 * a workout is skipped. Summary numbers only: nothing here reveals sets,
 * weights per exercise, or body weight.
 */
export interface PublicProfile {
  id: Id;
  displayName: string | null;
  photoUrl: string | null;
  currentStreakDays: number;
  longestStreakDays: number;
  totalSessions: number;
  lastWorkoutDate: LocalDate | null;
  /** Completion rate of the most recent finished cycle, 0..1. */
  lastCycleCompletionRate: number | null;
  /** Whether the most recently scheduled workout was skipped. */
  skippedLastScheduled: boolean;
  achievementIds: Id[];
  /** Missing on cards written before build 12. */
  totalVolumeKg?: number;
  bestRecord?: BestRecord | null;
  /** The exercise logged in the most sessions. */
  favoriteExercise?: string | null;
  /** Account creation time. */
  trainingSince?: Timestamp | null;
  /** How many plans this person shares with buddies. */
  sharedPlanCount?: number;
  updatedAt: Timestamp;
}

/**
 * Stored at inviteCodes/{code}. What a scanned Iron Card resolves to before
 * the two are buddies: readable by any signed-in user who has the code, so
 * it carries a copy of the card rather than pointing at the private one.
 */
export interface InviteCode {
  code: string;
  uid: Id;
  card: PublicProfile;
  updatedAt: Timestamp;
}

export type BuddyStatus = 'pending_sent' | 'pending_received' | 'accepted';

/** Stored at users/{uid}/buddies/{otherUid}. */
export interface Buddy extends BaseDocument {
  userId: Id;
  status: BuddyStatus;
  /** Snapshots taken when the request was made, so pending rows can show a name. */
  displayName?: string | null;
  photoUrl?: string | null;
  /** Their card code, so their Iron Card can be opened again from the list. */
  inviteCode?: string | null;
}

export type ActivityKind = 'workout_done' | 'workout_skipped' | 'workout_pushed' | 'streak' | 'record' | 'cycle_done' | 'plan_shared' | 'joined';

/**
 * Stored at users/{uid}/activity/{id}: what the owner has been up to, in
 * the words buddies see ("Finished Upper · 15 sets"). Buddies read each
 * other's lists and merge them into one feed; nothing is fanned out.
 */
export interface Activity extends BaseDocument {
  ownerId: Id;
  kind: ActivityKind;
  title: string;
  detail: string | null;
  /** When it happened; createdAt is when it was written. */
  at: Timestamp;
}

/** Stored at users/{uid}/bodyWeight/{entryId}. */
export interface BodyWeightEntry extends BaseDocument {
  ownerId: Id;
  date: LocalDate;
  weightKg: number;
  source: 'manual' | 'healthkit' | 'health_connect';
  /** Health-store sample id, for entries imported from or written to it. */
  externalId?: string | null;
}

/** Stored at users/{uid}/achievements/{achievementId}. */
export interface AchievementUnlock extends BaseDocument {
  achievementId: Id;
  unlockedAt: Timestamp;
  /** What triggered it, for the share card. */
  context: {
    sessionId?: Id;
    cycleId?: Id;
    exerciseId?: Id;
    value?: number;
  };
}
