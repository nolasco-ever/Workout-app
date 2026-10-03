import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '../auth/AuthProvider';
import { DailySteps, healthService } from '../health';
import { connectHealth, importHealthWeights } from '../services/healthSync';
import { bodyWeightRepository } from '../repositories/bodyWeightRepository';

export interface StepsState {
  /** The device has a health store at all. */
  available: boolean | null;
  connected: boolean;
  loading: boolean;
  /** Why the last read failed, if it did; null when the store answered. */
  error: string | null;
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
  const [error, setError] = useState<string | null>(null);
  // The permission sheet is re-shown at most once per launch: a reinstall
  // forgets the grant while the profile still says connected, and the user
  // already said yes once. Declining again lands on the card's Reconnect.
  const reasked = useRef(false);

  useEffect(() => {
    healthService.isAvailable().then(setAvailable);
  }, []);

  // Steps and the weigh-in import are independent: a failure in one must
  // not blank the other, and a failed step read says why on the card.
  const refresh = useCallback(async () => {
    if (!uid || !connected) return;
    setLoading(true);
    try {
      if (!reasked.current && (await healthService.needsAccessRequest())) {
        reasked.current = true;
        await healthService.requestAccess();
      }
      try {
        setDays(await healthService.getDailySteps(7));
        setError(null);
      } catch (err) {
        console.warn('steps read failed', err);
        setError(err instanceof Error ? err.message : String(err));
      }
      try {
        await importHealthWeights(uid, await bodyWeightRepository.list(uid));
      } catch (err) {
        console.warn('weigh-in import failed', err);
      }
    } finally {
      setLoading(false);
    }
  }, [uid, connected]);

  useEffect(() => {
    refresh().catch(err => console.warn('steps refresh failed', err));
  }, [refresh]);

  const connect = useCallback(async () => {
    if (!uid) return false;
    const ok = await connectHealth(uid);
    // Reconnecting from the card: read again right away so it fills in.
    if (ok && connected) await refresh();
    return ok;
  }, [uid, connected, refresh]);

  const todaySteps = days.length ? days[days.length - 1].steps : null;
  const weekAverage = days.length ? Math.round(days.reduce((n, d) => n + d.steps, 0) / days.length) : null;

  return { available, connected, loading, error, today: todaySteps, weekAverage, days, platformName: healthService.platformName, connect, refresh };
};
