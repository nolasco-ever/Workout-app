import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../auth/AuthProvider';
import { Activity } from '../models';
import { reactToActivity } from '../services/buddyService';
import { buddyRepository } from '../repositories/buddyRepository';
import { BuddyWithCard } from './useBuddies';

export interface ActivityEntry extends Activity {
  /** Who did it: null when it's the signed-in user. */
  actorName: string | null;
  actorPhoto: string | null;
  isMe: boolean;
}

/**
 * One feed from the buddies' activity lists, newest first. The user's own
 * activity is left out: they were there for it, and it only pushed their
 * buddies' entries down. Read on demand rather than watched: it's a few
 * small reads, and it refreshes when the screen comes back or the buddy
 * list changes.
 */
export const useBuddyActivity = (buddies: BuddyWithCard[], max = 20): { items: ActivityEntry[]; loading: boolean; refresh: () => Promise<void>; react: (item: Activity, emoji: string | null) => void } => {
  const { uid, profile } = useAuth();
  const [raw, setRaw] = useState<Activity[] | null>(null);
  const key = buddies.map(b => b.userId).sort().join('|');

  const refresh = useCallback(async () => {
    if (!uid) return;
    const ids = key ? key.split('|') : [];
    const lists = await Promise.all(ids.map(id => buddyRepository.listActivity(id, max).catch(() => [] as Activity[])));
    setRaw(lists.flat().sort((a, b) => b.at - a.at).slice(0, max));
  }, [uid, key, max]);

  useEffect(() => {
    refresh().catch(err => console.warn('activity load failed', err));
  }, [refresh]);

  // Names and photos are looked up at render, not baked in at fetch time:
  // buddy cards load after the list does, and a feed fetched before then
  // would show initials until the next refresh.
  const items = useMemo(() => {
    if (!raw) return [];
    const people = new Map(buddies.map(b => [b.userId, { name: b.card?.displayName ?? b.displayName ?? null, photo: b.card?.photoUrl ?? b.photoUrl ?? null }]));
    return raw.map(a => {
      const p = people.get(a.ownerId);
      return { ...a, actorName: p?.name ?? null, actorPhoto: p?.photo ?? null, isMe: false };
    });
  }, [raw, buddies]);

  // Optimistic: the chip changes at once, the write follows; a failed write puts it back.
  const react = useCallback(
    (item: Activity, emoji: string | null) => {
      if (!uid) return;
      const apply = (list: Activity[] | null, value: string | null) =>
        list?.map(a => {
          if (a.id !== item.id) return a;
          const reactions = { ...(a.reactions ?? {}) };
          if (value) reactions[uid] = { emoji: value, at: Date.now(), name: profile?.displayName ?? null };
          else delete reactions[uid];
          return { ...a, reactions };
        }) ?? null;
      const before = item.reactions?.[uid]?.emoji ?? null;
      setRaw(list => apply(list, emoji));
      reactToActivity({ uid, displayName: profile?.displayName ?? null }, item, emoji).catch(err => {
        console.warn('reaction failed', err);
        setRaw(list => apply(list, before));
      });
    },
    [uid, profile?.displayName],
  );

  return useMemo(() => ({ items, loading: raw === null, refresh, react }), [items, raw, refresh, react]);
};
