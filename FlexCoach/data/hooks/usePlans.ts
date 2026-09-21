import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../auth/AuthProvider';
import { Plan } from '../models';
import { planRepository } from '../repositories/planRepository';

/** Live list of the user's plans, newest first. */
export const usePlans = (): { plans: Plan[]; loading: boolean; refresh: () => Promise<void> } => {
  const { uid } = useAuth();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (!uid) return;
    return planRepository.watchAll(uid, list => {
      setPlans(list);
      setLoading(false);
    });
  }, [uid]);
  /** The list is live already; a manual refresh re-reads once for pull-to-refresh feedback. */
  const refresh = useCallback(async () => {
    if (!uid) return;
    setPlans(await planRepository.list(uid));
  }, [uid]);
  return { plans, loading, refresh };
};
