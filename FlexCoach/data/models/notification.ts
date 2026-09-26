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
  | { screen: 'buddy_activity' };

export type FeedNotificationKind =
  | 'missed_workout'
  | 'cycle_finished'
  | 'achievement'
  | 'buddy_request'
  | 'buddy_accepted'
  | 'buddy_workout'
  | 'buddy_skipped'
  | 'buddy_streak'
  | 'buddy_achievement';

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
