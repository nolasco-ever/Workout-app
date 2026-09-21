import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../auth/AuthProvider';
import { DailySteps, healthService } from '../health';
import { connectHealth, importHealthWeights } from '../services/healthSync';
import { bodyWeightRepository } from '../repositories/bodyWeightRepository';

export interface StepsState {
  /** The device has a health store at all. */
  available: boolean | null;
  connected: boolean;
  loading: boolean;
  today: number | null;
  weekAverage: number | null;
  days: DailySteps[];
  platformName: string;
  connect: () => Promise<boolean>;
  refresh: () => Promise<void>;
}

/** Steps from the health store, plus the connect flow. Also imports Health weigh-ins on refresh. */
export const useSteps = (): StepsState => {
  const { uid, profile } = useAuth();
  const connected = !!profile?.healthConnectedAt;
  const [available, setAvailable] = useState<boolean | null>(null);
  const [days, setDays] = useState<DailySteps[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    healthService.isAvailable().then(setAvailable);
  }, []);

  const refresh = useCallback(async () => {
    if (!uid || !connected) return;
    setLoading(true);
    try {
      const [steps, existing] = await Promise.all([healthService.getDailySteps(7), bodyWeightRepository.list(uid)]);
      setDays(steps);
      await importHealthWeights(uid, existing);
    } finally {
      setLoading(false);
    }
  }, [uid, connected]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const connect = useCallback(async () => {
    if (!uid) return false;
    const ok = await connectHealth(uid);
    return ok;
  }, [uid]);

  const todaySteps = days.length ? days[days.length - 1].steps : null;
  const weekAverage = days.length ? Math.round(days.reduce((n, d) => n + d.steps, 0) / days.length) : null;

  return { available, connected, loading, today: todaySteps, weekAverage, days, platformName: healthService.platformName, connect, refresh };
};
