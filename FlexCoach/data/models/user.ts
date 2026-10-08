import { BaseDocument, DistanceUnit, Id, LocalDate, Timestamp, WeightUnit } from './common';
import { NotificationPrefs } from './notification';
import { MeasurementType } from './exercise';

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
  /** Android: when the one-time "allow exact timing" prompt for the rest timer was shown. */
  exactAlarmPromptedAt?: Timestamp | null;
  /** The code on this account's Iron Card (see inviteCodes); made on first visit to Buddies. */
  inviteCode?: string | null;
  /** What buddies get to see; missing means everything (see withSharingDefaults). */
  sharing?: Partial<SharingPrefs> | null;
  /** When the one-time "what buddies see" sheet was shown, after the first buddy. */
  sharingPromptSeenAt?: Timestamp | null;
  /** When badges already earned were granted in one go, on the first launch with achievements. */
  achievementsBackfilledAt?: Timestamp | null;
}

/**
 * What of the owner's training their buddies can see. Everything is on
 * by default. `workouts` off means a finished workout is not shared at
 * all; on with `sets`, `reps` and `weight` all off shares that it was
 * finished and which exercises were done, nothing more.
 */
export interface SharingPrefs {
  workouts: boolean;
  sets: boolean;
  reps: boolean;
  weight: boolean;
  /** New records: feed lines, the records on a workout, the record graph. */
  records: boolean;
  /** Sets and weight moved on feed lines; best lift and weight moved on the card. */
  totals: boolean;
  /** Skipped and moved workouts as feed lines. */
  skips: boolean;
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

/**
 * Buddies have no request step: sharing a card is the invitation and
 * adding is the acceptance, like saving a contact. The status field is
 * kept for the rules and for any future "blocked" state.
 */
export type BuddyStatus = 'accepted';

/** Stored at users/{uid}/buddies/{otherUid}, mirrored on both sides. */
export interface Buddy extends BaseDocument {
  userId: Id;
  status: BuddyStatus;
  /** Snapshots taken when the buddy was added, until their live card loads. */
  displayName?: string | null;
  photoUrl?: string | null;
  /** Their card code, so their Iron Card can be opened again from the list. */
  inviteCode?: string | null;
  /**
   * On the row a person writes into someone else's list: that someone's
   * card code, proving they had the card. The rules check it against the
   * owner's profile before letting the row be created.
   */
  viaCode?: string | null;
}

export type ActivityKind = 'workout_done' | 'workout_skipped' | 'workout_pushed' | 'streak' | 'record' | 'cycle_done' | 'plan_shared' | 'joined' | 'achievement';

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
  /** The session behind a finished workout or a record, so the owner can be sent back to it. */
  sessionId?: Id | null;
  /** Records set in a finished workout, in display form ("Bench Press", "185 lb"); id and kind link them to their record lines. */
  records?: { exerciseName: string; value: string; exerciseId?: Id; kind?: RecordKind }[];
  /**
   * On a record line: the record in numbers, with the exercise's history
   * up to it (one point per session, stored units) so a buddy can see the
   * graph without reading sessions. Written only when records are shared.
   */
  record?: SharedRecord;
  /**
   * What was done in a finished workout, as much of it as the owner's
   * sharing prefs allow (see engine/sharing.ts). Missing on lines written
   * before sharing details existed and when workout details are off.
   */
  exercises?: SharedExercise[];
  /**
   * Buddies' reactions, one per person, keyed by their uid. Buddies may
   * write only their own key (see firestore.rules); everything else on
   * the document stays the owner's.
   */
  reactions?: Record<Id, ActivityReaction>;
}

export type RecordKind = 'weight' | 'reps' | 'duration' | 'distance';

export interface SharedRecord {
  exerciseId: Id;
  kind: RecordKind;
  /** The record itself, in stored units (kg, reps, seconds, metres). */
  value: number;
  date: LocalDate;
  /** Best of each session of this exercise, oldest first, ending on the record. */
  history: { date: LocalDate; value: number }[];
}

/** One exercise of a shared workout. Only the fields the owner shares are present. */
export interface SharedExercise {
  name: string;
  /** Catalog id, for the muscle map; the catalog is bundled, so it reveals nothing. */
  exerciseId?: Id;
  measurement: MeasurementType;
  /** Completed sets in order, when sets are shared. */
  sets?: SharedSet[];
  /** The exercise's best completed working set, when sets are hidden but reps or weight are shared. */
  top?: SharedSet;
}

export interface SharedSet {
  warmup?: boolean;
  weightKg?: number | null;
  reps?: number | null;
  durationSec?: number | null;
  distanceM?: number | null;
}

export interface ActivityReaction {
  emoji: string;
  at: Timestamp;
  /** The reactor's name at the time, so a row can say who without another read. */
  name: string | null;
}

/**
 * The emoji a buddy can react with, in the order the picker shows them:
 * a row of cheers, then a row that fits a skipped workout or a soft bench.
 */
export const REACTION_EMOJI = ['🔥', '💪', '👏', '😮', '❤️', '🏆', '🎉', '🚀', '😤', '😴', '👎', '😬'] as const;
/** Picker columns; the set wraps into rows of this many. */
export const REACTION_COLUMNS = 6;

/** Stored at users/{uid}/bodyWeight/{entryId}. */
export interface BodyWeightEntry extends BaseDocument {
  ownerId: Id;
  date: LocalDate;
  weightKg: number;
  source: 'manual' | 'healthkit' | 'health_connect';
  /** Health-store sample id, for entries imported from or written to it. */
  externalId?: string | null;
}

/** The badge families. Each has tiers; see engine/achievements.ts for the ladders. */
export type AchievementFamilyId = 'workouts' | 'streak' | 'volume' | 'records' | 'cycles' | 'perfect_cycles' | 'early_bird' | 'night_owl' | 'buddies' | 'plan_uses';

/**
 * Stored at users/{uid}/achievements/{achievementId}, one document per
 * tier reached; the id is `<family>:<tier>` so re-unlocking is a no-op.
 * Most families are judged on the device after a workout or a cycle
 * report; the buddy ones are judged by a Cloud Function so they unlock
 * while the app is closed. The celebration is shown once, then stamped.
 */
export interface AchievementUnlock extends BaseDocument {
  achievementId: Id;
  family: AchievementFamilyId;
  /** 1-based tier within the family. */
  tier: number;
  /** The number that earned it, in the family's own unit (workouts, days, lb or kg moved...). */
  threshold: number;
  /** The value measured when it unlocked. */
  value: number;
  unlockedAt: Timestamp;
  /** Who judged it: the app, the server, or the one-time catch-up on the first launch with badges. */
  source: 'device' | 'server' | 'backfill';
  /** When the owner saw the celebration; null until then. */
  celebratedAt: Timestamp | null;
  /** What triggered it. */
  context: {
    sessionId?: Id;
    cycleId?: Id;
    exerciseId?: Id;
    value?: number;
  };
}

/**
 * Stored at users/{ownerUid}/planUses/{buddyUid}: a buddy who copied or
 * synced one of the owner's shared plans. The buddy writes it; it is
 * never removed, so the count only grows.
 */
export interface PlanUse extends BaseDocument {
  buddyUid: Id;
  planIds: Id[];
  firstAt: Timestamp;
}
