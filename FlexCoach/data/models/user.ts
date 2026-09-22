import { BaseDocument, DistanceUnit, Id, LocalDate, Timestamp, WeightUnit } from './common';

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
}

/**
 * Stored at publicProfiles/{uid}. This is the only document a buddy can read,
 * refreshed whenever a session completes. Nothing here reveals sets, weights,
 * or body weight.
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
  updatedAt: Timestamp;
}

export type BuddyStatus = 'pending_sent' | 'pending_received' | 'accepted';

/** Stored at users/{uid}/buddies/{otherUid}. */
export interface Buddy extends BaseDocument {
  userId: Id;
  status: BuddyStatus;
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
