import { getFirestore } from 'firebase-admin/firestore';
import { getFunctions } from 'firebase-admin/functions';
import { getMessaging, type ApsAlert } from 'firebase-admin/messaging';
import { onDocumentWritten } from 'firebase-functions/v2/firestore';
import { onTaskDispatched } from 'firebase-functions/v2/tasks';
import { logger } from 'firebase-functions/v2';

const REGION = 'us-central1';
const QUEUE = 'restOverPush';
const BUNDLE_ID = 'com.flexcoach';

/** Mirrors data/repositories/liveActivityRepository.ts in the app. */
interface LiveActivitySchedule {
  sessionId: string;
  token: string;
  deviceToken: string | null;
  restId: string | null;
  restEndsAt: number | null;
  state: LiveActivityState | null;
  updatedAt: number;
}

/** Mirrors data/liveActivity/liveActivity.ts; times are milliseconds since 1970. */
interface LiveActivityState {
  phase: 'working' | 'rest' | 'restOver' | 'cardio' | 'done';
  exerciseName: string;
  setLabel: string;
  nextTarget?: string;
  nextSetId?: string;
  restEndsAt?: number;
  restSeconds: number;
  cardioStartedAt?: number;
  cardioTargetSeconds?: number;
  startedAt: number;
  summary?: string;
}

interface RestOverTask {
  uid: string;
  sessionId: string;
  restId: string;
}

/** ActivityKit decodes the pushed state with Swift's default date coding: seconds since 2001-01-01. */
const toAppleDate = (ms: number): number => ms / 1000 - 978307200;

/**
 * The state as the activity's Swift `WorkoutActivityState` decodes it. The app saves the next set as `restOver`;
 * the push sends it as `working` marked with the rest's end, so the compact Island shows the elapsed clock at once
 * and the opened Island and lock screen read "Rest over" on the next set. Build 19 sent `restOver` with a stale date
 * a few seconds on, and iOS took a minute or more to redraw it as the next set.
 */
const contentState = (state: LiveActivityState, restEndsAt: number): Record<string, unknown> => ({
  phase: state.phase === 'restOver' ? 'working' : state.phase,
  restEndedAt: state.phase === 'restOver' ? toAppleDate(restEndsAt) : null,
  exerciseName: state.exerciseName,
  setLabel: state.setLabel,
  nextTarget: state.nextTarget ?? null,
  nextSetId: state.nextSetId ?? null,
  restEndsAt: state.restEndsAt === undefined ? null : toAppleDate(state.restEndsAt),
  restSeconds: state.restSeconds,
  cardioStartedAt: state.cardioStartedAt === undefined ? null : toAppleDate(state.cardioStartedAt),
  cardioTargetSeconds: state.cardioTargetSeconds ?? null,
  startedAt: toAppleDate(state.startedAt),
  summary: state.summary ?? null,
});

/**
 * A rest started (or was skipped): queue the push for its end, or let any
 * queued one find nothing to do. The task carries the rest's id, so a push
 * queued for an earlier rest does nothing once a later one is running.
 */
export const scheduleRestOver = onDocumentWritten({ document: 'users/{uid}/liveActivities/{sessionId}', region: REGION }, async event => {
  const after = event.data?.after.data() as LiveActivitySchedule | undefined;
  if (!after || !after.restId || !after.restEndsAt || !after.token) return;
  const before = event.data?.before.data() as LiveActivitySchedule | undefined;
  if (before?.restId === after.restId && before?.restEndsAt === after.restEndsAt) return;
  const payload: RestOverTask = { uid: event.params.uid, sessionId: event.params.sessionId, restId: after.restId };
  await getFunctions().taskQueue(QUEUE).enqueue(payload, { scheduleTime: new Date(after.restEndsAt) });
  logger.info('rest-over push queued', { uid: payload.uid, sessionId: payload.sessionId, at: after.restEndsAt });
});

/** At the rest's end: the activity shows the next set, the Island opens on it, the lock screen lights up. */
export const restOverPush = onTaskDispatched<RestOverTask>(
  { region: REGION, retryConfig: { maxAttempts: 3, minBackoffSeconds: 5 }, rateLimits: { maxConcurrentDispatches: 20 } },
  async request => {
    const { uid, sessionId, restId } = request.data;
    const ref = getFirestore().doc(`users/${uid}/liveActivities/${sessionId}`);
    const snapshot = await ref.get();
    const schedule = snapshot.data() as LiveActivitySchedule | undefined;
    // The rest was skipped, another one started, or the workout ended: nothing to say.
    if (!schedule || schedule.restId !== restId || !schedule.restEndsAt || !schedule.state || !schedule.deviceToken) {
      logger.info('rest-over push skipped', { uid, sessionId, restId });
      return;
    }
    const state = schedule.state;
    const body = state.nextTarget ? `${state.exerciseName} · ${state.nextTarget}` : state.exerciseName;
    await getMessaging().send({
      token: schedule.deviceToken,
      apns: {
        liveActivityToken: schedule.token,
        headers: { 'apns-push-type': 'liveactivity', 'apns-priority': '10', 'apns-topic': `${BUNDLE_ID}.push-type.liveactivity` },
        payload: {
          aps: {
            timestamp: Math.floor(Date.now() / 1000),
            event: 'update',
            'content-state': contentState(state, schedule.restEndsAt),
            alert: { title: 'Rest over', body, sound: 'default' } as unknown as ApsAlert,
          },
        },
      },
    });
    await ref.set({ restId: null, restEndsAt: null, state: null, updatedAt: Date.now() }, { merge: true });
    logger.info('rest-over push sent', { uid, sessionId, restId });
  },
);
