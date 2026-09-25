import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getMessaging, type MulticastMessage } from 'firebase-admin/messaging';
import { onDocumentCreated } from 'firebase-functions/v2/firestore';
import { logger } from 'firebase-functions/v2';

initializeApp();
const db = getFirestore();

/** Mirrors data/models/notification.ts in the app. */
interface FeedNotification {
  id: string;
  ownerId: string;
  kind: string;
  title: string;
  body: string;
  target: { screen: string; [key: string]: unknown };
  readAt: number | null;
  push: boolean;
  pushedAt?: number | null;
}

interface NotificationPrefs {
  enabled?: boolean;
  buddies?: boolean;
}

const STALE_TOKEN_CODES = new Set(['messaging/registration-token-not-registered', 'messaging/invalid-registration-token', 'messaging/invalid-argument']);

/**
 * Deliver a feed item to the user's devices. The app creates feed items for
 * itself with `push: false` (it already showed a local reminder); items other
 * users or server code create with `push: true` are sent here. Writing a feed
 * document is therefore the one way to notify someone, in-app and on their
 * phone at once.
 */
export const sendFeedPush = onDocumentCreated({ document: 'users/{uid}/notifications/{notificationId}', region: 'us-central1' }, async event => {
  const snapshot = event.data;
  if (!snapshot) return;
  const item = snapshot.data() as FeedNotification;
  if (!item.push || item.pushedAt) return;

  const uid = event.params.uid;
  const profile = await db.doc(`users/${uid}`).get();
  const prefs = (profile.get('notifications') ?? {}) as NotificationPrefs;
  if (prefs.enabled === false) return;
  if (item.kind.startsWith('buddy') && prefs.buddies === false) return;

  const devices = await db.collection(`users/${uid}/devices`).get();
  const tokens = devices.docs.map(d => d.id);
  if (tokens.length === 0) {
    logger.info('no devices registered', { uid, kind: item.kind });
    return;
  }

  const message: MulticastMessage = {
    tokens,
    notification: { title: item.title, body: item.body },
    data: { target: JSON.stringify(item.target), kind: item.kind, notificationId: item.id },
    android: {
      priority: 'high',
      notification: { channelId: item.kind.startsWith('buddy') ? 'social' : 'reminders', icon: 'ic_notification', sound: 'default' },
    },
    apns: { payload: { aps: { sound: 'default', 'thread-id': item.kind } } },
  };

  const result = await getMessaging().sendEachForMulticast(message);
  const stale = result.responses.map((r, i) => (r.success || !STALE_TOKEN_CODES.has(r.error?.code ?? '') ? null : tokens[i])).filter((t): t is string => t !== null);
  if (stale.length) {
    const batch = db.batch();
    for (const token of stale) batch.delete(db.doc(`users/${uid}/devices/${token}`));
    await batch.commit();
  }
  logger.info('push sent', { uid, kind: item.kind, sent: result.successCount, failed: result.failureCount, pruned: stale.length });
  await snapshot.ref.update({ pushedAt: Date.now() });
});
