import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../auth/AuthProvider';
import { FeedNotification } from '../models';
import { notificationRepository } from '../repositories/notificationRepository';

export interface NotificationFeed {
  items: FeedNotification[];
  loading: boolean;
  unreadCount: number;
  markRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
  remove: (id: string) => Promise<void>;
  /** Re-list the feed on demand (pull to refresh). The live watch keeps it current otherwise. */
  refresh: () => Promise<void>;
}

/** Live feed of durable notifications for the signed-in user. */
export const useNotificationFeed = (): NotificationFeed => {
  const { uid } = useAuth();
  const [items, setItems] = useState<FeedNotification[] | null>(null);

  useEffect(() => {
    if (!uid) {
      setItems([]);
      return;
    }
    return notificationRepository.watch(uid, setItems);
  }, [uid]);

  return useMemo(
    () => ({
      items: items ?? [],
      loading: items === null,
      unreadCount: (items ?? []).filter(i => i.readAt === null).length,
      markRead: async id => {
        if (uid) await notificationRepository.markRead(uid, id);
      },
      markAllRead: async () => {
        if (uid && items) await notificationRepository.markAllRead(uid, items);
      },
      remove: async id => {
        if (uid) await notificationRepository.remove(uid, id);
      },
      refresh: async () => {
        if (uid) setItems(await notificationRepository.list(uid));
      },
    }),
    [uid, items],
  );
};
