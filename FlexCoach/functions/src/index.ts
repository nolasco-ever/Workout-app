import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getMessaging, type MulticastMessage } from 'firebase-admin/messaging';
import { onDocumentCreated, onDocumentWritten } from 'firebase-functions/v2/firestore';
import { logger } from 'firebase-functions/v2';
import { FieldValue } from 'firebase-admin/firestore';
import { ServerFamily, serverAchievementId, tiersReached } from './ladders';

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
  buddyAchievements?: boolean;
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
  if (item.kind === 'buddy_achievement' && prefs.buddyAchievements === false) return;

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

/**
 * Badges for the two families that change while the app is closed: a
 * buddy adding you, and a buddy copying or syncing your plan. The app
 * judges every other family itself (data/services/achievementService.ts).
 * Writes mirror the app's: the unlock document, a feed line (pushed) for
 * the owner, an activity line, a push to each buddy, and the badge id on
 * the Iron Card. The celebration is shown by the app when it next sees an
 * unlock without a `celebratedAt`.
 */

const MATERIALS = ['bronze', 'silver', 'gold', 'platinum', 'ruby', 'sapphire', 'emerald', 'diamond'];
const FAMILY_NAMES: Record<ServerFamily, string> = { buddies: 'Buddies', plan_uses: 'Plans used' };

const plural = (n: number, one: string, many: string): string => `${n} ${n === 1 ? one : many}`;
const tierLabel = (family: ServerFamily, threshold: number): string =>
  family === 'buddies' ? plural(threshold, 'buddy', 'buddies') : `${plural(threshold, 'buddy', 'buddies')} on your plans`;
const firstName = (name: unknown): string => (typeof name === 'string' && name.trim() ? name.trim().split(/\s+/)[0] : 'Your buddy');

const awardServerBadges = async (uid: string, family: ServerFamily, value: number): Promise<void> => {
  const reached = tiersReached(family, value);
  if (reached.length === 0) return;
  const profile = await db.doc(`users/${uid}`).get();
  if (!profile.exists) return;
  const displayName = (profile.get('displayName') as string | null) ?? null;
  const now = Date.now();
  const fresh: { id: string; tier: number; threshold: number }[] = [];
  for (const { tier, threshold } of reached) {
    const id = serverAchievementId(family, tier);
    if ((await db.doc(`users/${uid}/achievements/${id}`).get()).exists) continue;
    fresh.push({ id, tier, threshold });
  }
  if (fresh.length === 0) return;

  const buddies = (await db.collection(`users/${uid}/buddies`).where('status', '==', 'accepted').get()).docs.map(d => d.id);
  const batch = db.batch();
  for (const { id, tier, threshold } of fresh) {
    const label = tierLabel(family, threshold);
    const material = MATERIALS[Math.min(tier, MATERIALS.length) - 1];
    batch.set(db.doc(`users/${uid}/achievements/${id}`), {
      id,
      achievementId: id,
      family,
      tier,
      threshold,
      value,
      unlockedAt: now,
      source: 'server',
      celebratedAt: null,
      context: {},
      createdAt: now,
      updatedAt: now,
    });
    // The owner's own line, pushed: this happened while they were away.
    batch.set(db.doc(`users/${uid}/notifications/achievement:${id}`), {
      id: `achievement:${id}`,
      ownerId: uid,
      kind: 'achievement',
      title: `Badge unlocked: ${label} 🏅`,
      body: tier === 1 ? `Your ${FAMILY_NAMES[family]} badge is yours. Tap to see it` : `Your ${FAMILY_NAMES[family]} badge is now ${material}. Tap to see it`,
      target: { screen: 'achievement', achievementId: id },
      readAt: null,
      push: true,
      pushedAt: null,
      createdAt: now,
      updatedAt: now,
    });
    batch.set(db.doc(`users/${uid}/activity/achievement:${id}`), {
      id: `achievement:${id}`,
      ownerId: uid,
      kind: 'achievement',
      title: `Unlocked a badge: ${label}`,
      detail: `${FAMILY_NAMES[family]} · ${material}`,
      at: now,
      createdAt: now,
      updatedAt: now,
    });
    for (const buddy of buddies) {
      batch.set(db.doc(`users/${buddy}/notifications/buddy_achievement:${uid}:${id}`), {
        id: `buddy_achievement:${uid}:${id}`,
        ownerId: buddy,
        kind: 'buddy_achievement',
        title: `${firstName(displayName)} unlocked a badge 🏅`,
        body: `${label}. Tap to see their card`,
        target: { screen: 'buddy', uid, displayName },
        readAt: null,
        push: true,
        pushedAt: null,
        createdAt: now,
        updatedAt: now,
      });
    }
  }
  batch.set(db.doc(`publicProfiles/${uid}`), { achievementIds: FieldValue.arrayUnion(...fresh.map(f => f.id)), updatedAt: now }, { merge: true });
  await batch.commit();
  logger.info('server badges awarded', { uid, family, value, tiers: fresh.map(f => f.tier), buddies: buddies.length });
};

/** Someone was added to this user's buddy list: count accepted buddies. */
export const judgeBuddyBadges = onDocumentCreated({ document: 'users/{uid}/buddies/{otherUid}', region: 'us-central1' }, async event => {
  if (event.data?.get('status') !== 'accepted') return;
  const uid = event.params.uid;
  const count = (await db.collection(`users/${uid}/buddies`).where('status', '==', 'accepted').count().get()).data().count;
  await awardServerBadges(uid, 'buddies', count);
});

/** A buddy noted that they use one of this user's plans: count distinct buddies. */
export const judgePlanUseBadges = onDocumentWritten({ document: 'users/{uid}/planUses/{buddyUid}', region: 'us-central1' }, async event => {
  if (!event.data?.after.exists) return;
  const uid = event.params.uid;
  const count = (await db.collection(`users/${uid}/planUses`).count().get()).data().count;
  await awardServerBadges(uid, 'plan_uses', count);
});
