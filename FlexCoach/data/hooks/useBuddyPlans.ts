import { useCallback, useEffect, useMemo, useState } from 'react';
import { Plan } from '../models';
import { planRepository } from '../repositories/planRepository';
import { BuddyWithCard } from './useBuddies';

export interface SharedPlan {
  plan: Plan;
  ownerUid: string;
  ownerName: string | null;
  ownerPhoto: string | null;
}

/** Every plan my buddies have made visible, newest first. */
export const useBuddyPlans = (buddies: BuddyWithCard[]): { plans: SharedPlan[]; loading: boolean; refresh: () => Promise<void> } => {
  const [plans, setPlans] = useState<SharedPlan[] | null>(null);
  const key = buddies.map(b => `${b.userId}:${b.card?.sharedPlanCount ?? 0}`).sort().join('|');

  const refresh = useCallback(async () => {
    const lists = await Promise.all(buddies.map(b => planRepository.listSharedBy(b.userId).catch(() => [] as Plan[])));
    const merged = buddies.flatMap((b, i) =>
      lists[i].filter(p => p.status !== 'archived').map(plan => ({ plan, ownerUid: b.userId, ownerName: b.card?.displayName ?? b.displayName ?? null, ownerPhoto: b.card?.photoUrl ?? b.photoUrl ?? null })),
    );
    setPlans(merged.sort((a, b) => b.plan.updatedAt - a.plan.updatedAt));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  useEffect(() => {
    refresh().catch(err => console.warn('buddy plans load failed', err));
  }, [refresh]);

  return useMemo(() => ({ plans: plans ?? [], loading: plans === null, refresh }), [plans, refresh]);
};
