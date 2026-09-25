import { Platform } from 'react-native';
import { paths } from '../firebase/paths';
import { DeviceToken, FeedNotification, Id, NotificationTarget, FeedNotificationKind } from '../models';
import { listDocs, orderBy, patchDoc, readDoc, removeDoc, watchDocs, writeDoc, writeDocs, Unsubscribe } from './base';

export interface NewFeedNotification {
  /** Deterministic ids (e.g. `missed:<occurrenceId>`) make creation idempotent. */
  id: Id;
  kind: FeedNotificationKind;
  title: string;
  body: string;
  target: NotificationTarget;
  push?: boolean;
}

export const notificationRepository = {
  watch: (uid: Id, onChange: (items: FeedNotification[]) => void): Unsubscribe =>
    watchDocs<FeedNotification>(paths.notifications(uid), onChange, orderBy('createdAt', 'desc')),

  list: (uid: Id) => listDocs<FeedNotification>(paths.notifications(uid), orderBy('createdAt', 'desc')),

  /** Create the item unless one with this id already exists, so read state survives re-detection. */
  ensure: async (uid: Id, item: NewFeedNotification): Promise<boolean> => {
    const existing = await readDoc<FeedNotification>(paths.notification(uid, item.id));
    if (existing) return false;
    const now = Date.now();
    const doc: FeedNotification = {
      id: item.id,
      ownerId: uid,
      kind: item.kind,
      title: item.title,
      body: item.body,
      target: item.target,
      readAt: null,
      push: item.push ?? false,
      pushedAt: null,
      createdAt: now,
      updatedAt: now,
    };
    await writeDoc(paths.notification(uid, item.id), doc);
    return true;
  },

  markRead: (uid: Id, notificationId: Id) => {
    const now = Date.now();
    return patchDoc<FeedNotification>(paths.notification(uid, notificationId), { readAt: now, updatedAt: now });
  },

  markAllRead: (uid: Id, items: FeedNotification[]) => {
    const now = Date.now();
    const unread = items.filter(i => i.readAt === null);
    return writeDocs(unread.map(i => ({ path: paths.notification(uid, i.id), data: { ...i, readAt: now, updatedAt: now } })));
  },

  remove: (uid: Id, notificationId: Id) => removeDoc(paths.notification(uid, notificationId)),

  saveDevice: (uid: Id, token: string) => {
    const device: DeviceToken = { token, platform: Platform.OS === 'ios' ? 'ios' : 'android', updatedAt: Date.now() };
    return writeDoc(paths.device(uid, token), device);
  },

  removeDevice: (uid: Id, token: string) => removeDoc(paths.device(uid, token)),
};
