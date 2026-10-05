import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../auth/AuthProvider';
import { Cycle, Occurrence, Plan, Session } from '../models';
import { today } from '../engine/dates';
import { getOccurrenceForDate, getOverdueOccurrences, getUpcomingOccurrences } from '../engine/schedule';
import { cycleReportReadyAt } from '../engine/cycleReport';
import { withPrefDefaults } from '../engine/notifications';
import { planRepository } from '../repositories/planRepository';
import { cycleRepository } from '../repositories/cycleRepository';
import { sessionRepository } from '../repositories/sessionRepository';
import { repairCycleNumbers } from '../services/workoutService';

export interface WorkoutHomeState {
  loading: boolean;
  plan: Plan | null;
  cycle: Cycle | null;
  todayDate: string;
  overdue: Occurrence[];
  todayOccurrence: Occurrence | null;
  upcoming: Occurrence[];
  inProgressSession: Session | null;
  /** The cycle's report is ready: every workout resolved and the report time has passed. The review screen (and the next cycle) opens from here. */
  cycleFinished: boolean;
  /** When the report lands, once every workout is resolved; null while the cycle is still going. */
  reportReadyAt: number | null;
  /** The owner has opened the report, so the next cycle may start. */
  reportReviewed: boolean;
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

  // Once per sign-in: cycles numbered before the current rule get fixed.
  useEffect(() => {
    if (!uid) return;
    repairCycleNumbers(uid).catch(err => console.warn('cycle renumber failed', err));
  }, [uid]);

  const todayDate = today();
  const morning = withPrefDefaults(profile?.notifications).morningTime;
  // A report that becomes ready while the tab is open flips the state without a reload.
  const [, setTick] = useState(0);
  const reportReadyAt = rawCycle && rawCycle.status === 'active' ? cycleReportReadyAt(rawCycle, morning) : null;
  useEffect(() => {
    if (reportReadyAt === null || reportReadyAt <= Date.now()) return;
    const id = setTimeout(() => setTick(t => t + 1), reportReadyAt - Date.now() + 500);
    return () => clearTimeout(id);
  }, [reportReadyAt]);

  return useMemo(() => {
    const cycleMatches = !!rawCycle && !!plan && rawCycle.planId === plan.id && rawCycle.status === 'active';
    const cycle = cycleMatches ? rawCycle : null;
    const overdue = cycle ? getOverdueOccurrences(cycle, todayDate) : [];
    const todayOccurrence = cycle ? getOccurrenceForDate(cycle, todayDate) ?? null : null;
    const upcoming = cycle ? getUpcomingOccurrences(cycle, todayDate) : [];
    const reportReady = !!cycle && reportReadyAt !== null && reportReadyAt <= Date.now();
    return {
      loading: !ready || !planLoaded || !cycleLoaded,
      plan,
      cycle,
      todayDate,
      overdue,
      todayOccurrence,
      upcoming,
      inProgressSession: inProgress.find(s => s.cycleId === cycle?.id) ?? inProgress[0] ?? null,
      cycleFinished: reportReady,
      reportReadyAt,
      reportReviewed: !!cycle?.reportReviewedAt,
      needsCycle: !!plan && plan.status === 'active' && !cycle,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, planLoaded, cycleLoaded, plan, rawCycle, todayDate, inProgress, reportReadyAt]);
};
