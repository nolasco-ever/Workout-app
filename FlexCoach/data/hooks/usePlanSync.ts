import { useEffect, useRef } from 'react';
import { useAuth } from '../auth/AuthProvider';
import { Plan } from '../models';
import { isSynced, sourceIsNewer, substanceDiffers, syncEndReason } from '../engine/planSync';
import { planRepository } from '../repositories/planRepository';
import { cycleRepository } from '../repositories/cycleRepository';
import { notificationRepository } from '../repositories/notificationRepository';
import { applySyncedSource, stopSyncing } from '../services/planService';

/**
 * Keeps every synced copy in step with its buddy's plan while the app is
 * open. One listener per synced plan: a newer source is applied (with a
 * feed line saying so); a source that was deleted, archived, un-shared or
 * is no longer readable turns the copy into a plain one, with a feed line
 * explaining why.
 */
export const usePlanSync = (): void => {
  const { uid, profile } = useAuth();
  const profileRef = useRef(profile);
  profileRef.current = profile;
  const busy = useRef(new Set<string>());

  useEffect(() => {
    if (!uid) return;
    const listeners = new Map<string, () => void>();
    const latest = new Map<string, Plan>();

    const endSync = async (mine: Plan, reason: 'deleted' | 'unshared' | 'archived' | 'unreadable') => {
      if (!isSynced(mine)) return;
      await stopSyncing(uid, mine);
      const who = mine.sharedFrom?.displayName?.split(' ')[0] ?? 'Your buddy';
      const why =
        reason === 'deleted' ? `${who} deleted the plan you were syncing with` : reason === 'archived' ? `${who} archived the plan you were syncing with` : `${who}'s plan is no longer shared with you`;
      await notificationRepository.ensure(uid, {
        id: `plan_sync_ended:${mine.id}`,
        kind: 'plan_sync_ended',
        title: `${mine.name} is now your own copy`,
        body: `${why}. Your copy stays as it is and is yours to edit.`,
        target: { screen: 'workout' },
      });
    };

    const follow = async (mine: Plan, source: Plan) => {
      if (!sourceIsNewer(mine, source)) return;
      if (!substanceDiffers(mine, source)) {
        // Only the buddy's own bookkeeping changed (visibility, timestamps): just note the version.
        await planRepository.save(uid, { ...mine, sharedFrom: { ...mine.sharedFrom!, sourceUpdatedAt: source.updatedAt } });
        return;
      }
      const p = profileRef.current;
      const activeCycle = mine.status === 'active' && p?.activeCycleId ? await cycleRepository.get(uid, p.activeCycleId) : null;
      const { restarted } = await applySyncedSource(uid, mine, source, activeCycle);
      const who = source.ownerId === mine.sharedFrom?.userId ? mine.sharedFrom?.displayName?.split(' ')[0] ?? 'Your buddy' : 'Your buddy';
      await notificationRepository.ensure(uid, {
        id: `plan_synced:${mine.id}:${source.updatedAt}`,
        kind: 'plan_synced',
        title: `${source.name} was updated`,
        body: restarted ? `${who} changed the schedule or workouts, so a fresh cycle starts today.` : `${who} edited the plan. Changes apply from your next workout.`,
        target: { screen: 'workout' },
      });
    };

    const handle = (planId: string, fn: (mine: Plan) => Promise<void>) => {
      const mine = latest.get(planId);
      if (!mine || busy.current.has(planId)) return;
      busy.current.add(planId);
      fn(mine)
        .catch(err => console.warn('plan sync failed', err))
        .finally(() => busy.current.delete(planId));
    };

    const stopAll = () => {
      listeners.forEach(off => off());
      listeners.clear();
    };

    const offPlans = planRepository.watchAll(uid, plans => {
      const synced = plans.filter(p => isSynced(p) && p.sharedFrom && p.status !== 'archived');
      for (const p of synced) latest.set(p.id, p);
      // Drop listeners for plans that stopped syncing or went away.
      for (const [id, off] of listeners) {
        if (!synced.some(p => p.id === id)) {
          off();
          listeners.delete(id);
          latest.delete(id);
        }
      }
      for (const p of synced) {
        if (listeners.has(p.id)) continue;
        const { userId, planId } = p.sharedFrom!;
        listeners.set(
          p.id,
          planRepository.watchShared(
            userId,
            planId,
            source => {
              const reason = syncEndReason(source);
              if (reason) handle(p.id, mine => endSync(mine, reason));
              else handle(p.id, mine => follow(mine, source!));
            },
            () => handle(p.id, mine => endSync(mine, 'unreadable')),
          ),
        );
      }
    });

    return () => {
      offPlans();
      stopAll();
    };
  }, [uid]);
};
