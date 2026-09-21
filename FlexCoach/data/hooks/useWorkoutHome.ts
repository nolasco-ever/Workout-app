import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../auth/AuthProvider';
import { Cycle, Occurrence, Plan, Session } from '../models';
import { today } from '../engine/dates';
import { getOccurrenceForDate, getOverdueOccurrences, getUpcomingOccurrences, isCycleFinished } from '../engine/schedule';
import { planRepository } from '../repositories/planRepository';
import { cycleRepository } from '../repositories/cycleRepository';
import { sessionRepository } from '../repositories/sessionRepository';

export interface WorkoutHomeState {
  loading: boolean;
  plan: Plan | null;
  cycle: Cycle | null;
  todayDate: string;
  overdue: Occurrence[];
  todayOccurrence: Occurrence | null;
  upcoming: Occurrence[];
  inProgressSession: Session | null;
  /** Every workout in the cycle has been resolved, or the end date has passed. */
  cycleFinished: boolean;
  /** An active plan with no live cycle, e.g. after an interrupted activation. */
  needsCycle: boolean;
}

/**
 * Live state for the Workout tab. Subscribes to the active plan, the active
 * cycle, and any in-progress session, and derives what the screen shows.
 */
export const useWorkoutHome = (): WorkoutHomeState => {
  const { uid, profile, ready } = useAuth();
  const activePlanId = profile?.activePlanId ?? null;
  const activeCycleId = profile?.activeCycleId ?? null;

  const [plan, setPlan] = useState<Plan | null>(null);
  const [planLoaded, setPlanLoaded] = useState(false);
  const [rawCycle, setCycle] = useState<Cycle | null>(null);
  const [cycleLoaded, setCycleLoaded] = useState(false);
  const [inProgress, setInProgress] = useState<Session[]>([]);

  useEffect(() => {
    if (!uid || !activePlanId) {
      setPlan(null);
      setPlanLoaded(ready);
      return;
    }
    setPlanLoaded(false);
    return planRepository.watch(uid, activePlanId, p => {
      setPlan(p);
      setPlanLoaded(true);
    });
  }, [uid, activePlanId, ready]);

  useEffect(() => {
    if (!uid || !activeCycleId) {
      setCycle(null);
      setCycleLoaded(ready);
      return;
    }
    setCycleLoaded(false);
    return cycleRepository.watch(uid, activeCycleId, c => {
      setCycle(c);
      setCycleLoaded(true);
    });
  }, [uid, activeCycleId, ready]);

  useEffect(() => {
    if (!uid) return;
    return sessionRepository.watchInProgress(uid, setInProgress);
  }, [uid]);

  const todayDate = today();

  return useMemo(() => {
    const cycleMatches = !!rawCycle && !!plan && rawCycle.planId === plan.id && rawCycle.status === 'active';
    const cycle = cycleMatches ? rawCycle : null;
    const overdue = cycle ? getOverdueOccurrences(cycle, todayDate) : [];
    const todayOccurrence = cycle ? getOccurrenceForDate(cycle, todayDate) ?? null : null;
    const upcoming = cycle ? getUpcomingOccurrences(cycle, todayDate) : [];
    const allResolved = cycle ? cycle.occurrences.every(o => o.status !== 'scheduled' && o.status !== 'in_progress') : false;
    return {
      loading: !ready || !planLoaded || !cycleLoaded,
      plan,
      cycle,
      todayDate,
      overdue,
      todayOccurrence,
      upcoming,
      inProgressSession: inProgress.find(s => s.cycleId === cycle?.id) ?? inProgress[0] ?? null,
      cycleFinished: cycle ? isCycleFinished(cycle, todayDate) || allResolved : false,
      needsCycle: !!plan && plan.status === 'active' && !cycle,
    };
  }, [ready, planLoaded, cycleLoaded, plan, rawCycle, todayDate, inProgress]);
};
