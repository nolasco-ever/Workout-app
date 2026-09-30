import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../auth/AuthProvider';
import { Activity } from '../models';
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
export const useBuddyActivity = (buddies: BuddyWithCard[], max = 20): { items: ActivityEntry[]; loading: boolean; refresh: () => Promise<void> } => {
  const { uid } = useAuth();
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

  return useMemo(() => ({ items, loading: raw === null, refresh }), [items, raw, refresh]);
};
