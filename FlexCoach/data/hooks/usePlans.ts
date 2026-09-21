import { useEffect, useState } from 'react';
import { useAuth } from '../auth/AuthProvider';
import { Plan } from '../models';
import { planRepository } from '../repositories/planRepository';

/** Live list of the user's plans, newest first. */
export const usePlans = (): { plans: Plan[]; loading: boolean } => {
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
  return { plans, loading };
};
