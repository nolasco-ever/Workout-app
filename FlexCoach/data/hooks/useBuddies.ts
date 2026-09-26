import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../auth/AuthProvider';
import { Buddy, PublicProfile } from '../models';
import { buddyRepository } from '../repositories/buddyRepository';

export interface BuddyWithCard extends Buddy {
  /** Null until the card has loaded, or if they've never written one. */
  card: PublicProfile | null;
}

export interface BuddiesState {
  loading: boolean;
  /** Accepted buddies with their cards, name order. */
  buddies: BuddyWithCard[];
  /** Requests waiting for my answer. */
  incoming: Buddy[];
  /** Requests I sent that haven't been answered. */
  outgoing: Buddy[];
}

/** Live buddy list for the signed-in user, with each accepted buddy's Iron Card kept in step. */
export const useBuddies = (): BuddiesState => {
  const { uid } = useAuth();
  const [rows, setRows] = useState<Buddy[] | null>(null);
  const [cards, setCards] = useState<Record<string, PublicProfile | null>>({});

  useEffect(() => {
    if (!uid) {
      setRows([]);
      return;
    }
    return buddyRepository.watch(uid, setRows);
  }, [uid]);

  const acceptedIds = useMemo(() => (rows ?? []).filter(b => b.status === 'accepted').map(b => b.userId).sort().join('|'), [rows]);
  useEffect(() => {
    if (!acceptedIds) return;
    const subs = acceptedIds.split('|').map(id => buddyRepository.watchPublicProfile(id, card => setCards(c => ({ ...c, [id]: card }))));
    return () => subs.forEach(off => off());
  }, [acceptedIds]);

  return useMemo(() => {
    const all = rows ?? [];
    const name = (b: Buddy) => (cards[b.userId]?.displayName ?? b.displayName ?? '').toLowerCase();
    return {
      loading: rows === null,
      buddies: all
        .filter(b => b.status === 'accepted')
        .map(b => ({ ...b, card: cards[b.userId] ?? null }))
        .sort((a, b) => name(a).localeCompare(name(b))),
      incoming: all.filter(b => b.status === 'pending_received'),
      outgoing: all.filter(b => b.status === 'pending_sent'),
    };
  }, [rows, cards]);
};
