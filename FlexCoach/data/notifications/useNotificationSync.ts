import { useEffect, useMemo, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { useAuth } from '../auth/AuthProvider';
import { Cycle } from '../models';
import { today } from '../engine/dates';
import { getOverdueOccurrences, isCycleFinished } from '../engine/schedule';
import { planLocalNotifications, withPrefDefaults } from '../engine/notifications';
import { cycleRepository } from '../repositories/cycleRepository';
import { sessionRepository } from '../repositories/sessionRepository';
import { bodyWeightRepository } from '../repositories/bodyWeightRepository';
import { notificationRepository } from '../repositories/notificationRepository';
import { useNotificationFeed } from './useNotificationFeed';
import { dateLabel } from '../../components/charts/scale';
import { cancelAllScheduled, getPermission, PermissionState, requestPermission, startForegroundListener, syncScheduled } from './notificationService';
import { registerDevice, startPushListeners } from './pushService';
import { setRoutesReady } from './openTarget';

/**
 * Keeps three things in step with the user's data while they are signed in:
 *
 * 1. The OS's scheduled reminders, re-planned whenever the active cycle,
 *    the preferences or the app's foreground state change.
 * 2. The in-app feed's self-generated items: a missed workout and a finished
 *    cycle are written here so they exist even if the reminder was never seen.
 * 3. Push registration, once the OS permission is granted.
 *
 * The OS permission prompt is shown the first time a cycle becomes active
 * while the app is running (i.e. right after activating a plan), never on a
 * cold launch. The settings screen offers it too.
 */
export const useNotificationSync = (): { permission: PermissionState } => {
  const { uid, profile } = useAuth();
  const prefs = useMemo(() => withPrefDefaults(profile?.notifications), [profile?.notifications]);
  const prefsKey = JSON.stringify(prefs);
  const activeCycleId = profile?.activeCycleId ?? null;

  const [cycle, setCycle] = useState<Cycle | null>(null);
  const [foregroundTick, setForegroundTick] = useState(0);
  const [permission, setPermission] = useState<PermissionState>('undetermined');

  useEffect(() => {
    setRoutesReady(true);
    const off = startForegroundListener();
    return () => {
      off();
      setRoutesReady(false);
    };
  }, []);

  useEffect(() => {
    const sub = AppState.addEventListener('change', state => {
      if (state === 'active') setForegroundTick(t => t + 1);
    });
    return () => sub.remove();
  }, []);

  useEffect(() => {
    getPermission().then(setPermission).catch(() => undefined);
  }, [foregroundTick]);

  useEffect(() => {
    if (!uid || !activeCycleId) {
      setCycle(null);
      return;
    }
    return cycleRepository.watch(uid, activeCycleId, setCycle);
  }, [uid, activeCycleId]);

  // Ask for permission when a cycle appears during the session, not at launch.
  const seenCycleId = useRef<string | null | undefined>(undefined);
  useEffect(() => {
    if (!profile) return;
    if (seenCycleId.current === undefined) {
      seenCycleId.current = activeCycleId;
      return;
    }
    if (activeCycleId && activeCycleId !== seenCycleId.current && permission === 'undetermined' && prefs.enabled) {
      requestPermission().then(setPermission).catch(() => undefined);
    }
    seenCycleId.current = activeCycleId;
  }, [profile, activeCycleId, permission, prefs.enabled]);

  // Reconcile the OS's scheduled reminders with the plan.
  useEffect(() => {
    if (!uid) return;
    if (permission !== 'granted' || !prefs.enabled) {
      cancelAllScheduled().catch(() => undefined);
      return;
    }
    let cancelled = false;
    (async () => {
      const [sessions, weights] = await Promise.all([sessionRepository.listCompleted(uid), bodyWeightRepository.list(uid)]);
      if (cancelled) return;
      const planned = planLocalNotifications({
        cycle,
        sessions,
        prefs,
        todayDate: today(),
        now: Date.now(),
        lastWeighInDate: weights.length ? weights[weights.length - 1].date : null,
      });
      await syncScheduled(planned);
    })().catch(err => console.warn('[notifications] sync failed', err));
    return () => {
      cancelled = true;
    };
    // prefsKey stands in for prefs, whose identity changes every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uid, cycle, prefsKey, permission, foregroundTick]);

  // A missed-workout item is done with once the day is skipped or moved.
  const feed = useNotificationFeed();
  useEffect(() => {
    if (!uid || !cycle) return;
    const overdue = new Set(getOverdueOccurrences(cycle, today()).map(o => `missed:${o.id}`));
    for (const item of feed.items) {
      if (item.kind === 'missed_workout' && item.readAt === null && !overdue.has(item.id)) {
        notificationRepository.markRead(uid, item.id).catch(() => undefined);
      }
    }
  }, [uid, cycle, feed.items]);

  // Feed items the device generates for itself.
  const ensured = useRef(new Set<string>());
  useEffect(() => {
    if (!uid || !cycle || cycle.status !== 'active') return;
    const todayDate = today();
    const ensure = (item: Parameters<typeof notificationRepository.ensure>[1]) => {
      if (ensured.current.has(item.id)) return;
      ensured.current.add(item.id);
      notificationRepository.ensure(uid, item).catch(() => ensured.current.delete(item.id));
    };
    for (const o of getOverdueOccurrences(cycle, todayDate)) {
      ensure({
        id: `missed:${o.id}`,
        kind: 'missed_workout',
        title: `${o.workoutName ?? 'A workout'} didn't happen`,
        body: `It was scheduled for ${dateLabel(o.date)}. Skip it or move it to keep the cycle on track.`,
        target: { screen: 'workout' },
      });
    }
    const allResolved = cycle.occurrences.every(o => o.status !== 'scheduled' && o.status !== 'in_progress');
    if (isCycleFinished(cycle, todayDate) || allResolved) {
      ensure({
        id: `cycle_finished:${cycle.id}`,
        kind: 'cycle_finished',
        title: `Cycle ${cycle.number} is done`,
        body: 'See how it went, then start the next one.',
        target: { screen: 'cycle_summary', cycleId: cycle.id },
      });
    }
  }, [uid, cycle, foregroundTick]);

  // Push: register the device and route taps once the OS allows notifications.
  useEffect(() => {
    if (!uid || permission !== 'granted') return;
    registerDevice(uid).catch(() => undefined);
    return startPushListeners(uid);
  }, [uid, permission]);

  return { permission };
};
