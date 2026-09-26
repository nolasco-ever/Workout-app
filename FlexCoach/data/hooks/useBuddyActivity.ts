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
 * One feed from everyone's activity lists (mine included), newest first.
 * Read on demand rather than watched: it's a few small reads, and it
 * refreshes when the screen comes back or the buddy list changes.
 */
export const useBuddyActivity = (buddies: BuddyWithCard[], max = 20): { items: ActivityEntry[]; loading: boolean; refresh: () => Promise<void> } => {
  const { uid, profile } = useAuth();
  const [items, setItems] = useState<ActivityEntry[] | null>(null);
  const key = buddies.map(b => b.userId).sort().join('|');

  const refresh = useCallback(async () => {
    if (!uid) return;
    const people = [{ uid, name: profile?.displayName ?? null, photo: profile?.photoUrl ?? null, me: true }, ...buddies.map(b => ({ uid: b.userId, name: b.card?.displayName ?? b.displayName ?? null, photo: b.card?.photoUrl ?? b.photoUrl ?? null, me: false }))];
    const lists = await Promise.all(people.map(p => buddyRepository.listActivity(p.uid, max).catch(() => [] as Activity[])));
    const merged = people.flatMap((p, i) => lists[i].map(a => ({ ...a, actorName: p.name, actorPhoto: p.photo, isMe: p.me })));
    setItems(merged.sort((a, b) => b.at - a.at).slice(0, max));
    // buddies is represented by `key`; profile fields are read at call time.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uid, key, max, profile?.displayName, profile?.photoUrl]);

  useEffect(() => {
    refresh().catch(err => console.warn('activity load failed', err));
  }, [refresh]);

  return useMemo(() => ({ items: items ?? [], loading: items === null, refresh }), [items, refresh]);
};
