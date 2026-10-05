import { BaseDocument, Id, Timestamp, Weekday } from './common';

export interface ClockTime {
  hour: number;
  minute: number;
}

/**
 * Notification preferences, stored on the user profile so they follow the
 * account across devices. Time-based reminders are scheduled on the device
 * from these; the OS permission is separate and checked at runtime.
 */
export interface NotificationPrefs {
  enabled: boolean;
  workoutToday: boolean;
  eveningNudge: boolean;
  streakRisk: boolean;
  missedWorkout: boolean;
  planStarts: boolean;
  cycleFinished: boolean;
  restOver: boolean;
  weighIn: boolean;
  weighInWeekday: Weekday;
  morningTime: ClockTime;
  eveningTime: ClockTime;
  /** Buddy requests and activity, delivered by push once buddies exist. */
  buddies: boolean;
}

/** What the app opens when a notification is tapped. */
export type NotificationTarget =
  | { screen: 'workout' }
  | { screen: 'session'; sessionId: Id }
  | { screen: 'cycle_summary'; cycleId: Id }
  | { screen: 'body_weight' }
  | { screen: 'feed' }
  | { screen: 'buddies' }
  | { screen: 'buddy'; uid: Id; displayName?: string | null }
  | { screen: 'card'; code: string }
  | { screen: 'buddy_activity' }
  /** One finished workout of a buddy's, with its records and reactions. */
  | { screen: 'buddy_workout'; uid: Id; activityId: Id; displayName?: string | null }
  /** A plan a buddy shared, to use in sync or copy. */
  | { screen: 'buddy_plan'; ownerUid: Id; planId: Id; ownerName?: string | null }
  /** One of the user's own logged sessions. */
  | { screen: 'session_detail'; sessionId: Id; workoutName?: string | null };

export type FeedNotificationKind =
  | 'missed_workout'
  | 'cycle_finished'
  | 'achievement'
  | 'buddy_added'
  | 'buddy_removed'
  | 'buddy_workout'
  | 'buddy_skipped'
  | 'buddy_plan_shared'
  | 'buddy_streak'
  | 'buddy_achievement'
  | 'buddy_reaction'
  | 'plan_synced'
  | 'plan_sync_ended';

/**
 * Stored at users/{uid}/notifications/{id}. The in-app feed. Only durable
 * items live here: things worth revisiting or acting on. Time-based nudges
 * ("Push day", "rest over") are never stored.
 *
 * `push` asks the server to deliver it to the user's devices. Items the
 * device creates for itself (a missed workout it already reminded about)
 * set it false so nobody is told twice.
 */
export interface FeedNotification extends BaseDocument {
  ownerId: Id;
  kind: FeedNotificationKind;
  title: string;
  body: string;
  target: NotificationTarget;
  readAt: Timestamp | null;
  push: boolean;
  /** Set by the server once it has sent the push. */
  pushedAt?: Timestamp | null;
}

/** Stored at users/{uid}/devices/{token}. One row per app install that can receive push. */
export interface DeviceToken {
  token: string;
  platform: 'ios' | 'android';
  updatedAt: Timestamp;
}
