import { useEffect, useRef, useState } from 'react';
import { AppState, Platform } from 'react-native';
import { useAuth } from '../auth/AuthProvider';
import { Session } from '../models';
import { useWorkoutHome } from './useWorkoutHome';
import { sessionRepository } from '../repositories/sessionRepository';
import { addExerciseTo, saveExercises, startQuickSession, startWorkoutNow } from '../services/workoutService';
import { EQUIPMENT_OPTIONS, getCatalogExercise, searchCatalog } from '../catalog/exerciseCatalog';
import { newId } from '../engine/ids';
import { buildWatchHome } from '../liveActivity/watchHome';
import { parseWatchDistance, receiveWatchDistance } from '../liveActivity/watchDistance';
import { LiveActivityCommand, liveActivity, takeCommand } from '../liveActivity/liveActivity';
import { navigationRef } from '../../navigation/navigationRef';
import type { AppStackParams } from '../../appNavigators/AppStack';

/** A start asked for longer ago than this was not for now (the phone was off, or the app had been closed): it is dropped. */
const REQUEST_FRESH_MS = 60 * 1000;
const SEARCH_RESULTS = 12;

/**
 * The Apple Watch with no workout running (v1 #6, step 4): keeps the Watch's
 * home up to date with the Workout tab, and carries out what is tapped there.
 * Start, Quick workout and Resume start the workout here, as the tab's own
 * buttons do, and open it; the Watch then follows it as usual. Search asks
 * the phone's library, so both find the same exercises.
 */
export const useWatchHome = (): void => {
  const { uid, profile } = useAuth();
  const home = useWorkoutHome();
  const unit = profile?.weightUnit ?? 'lb';
  const [history, setHistory] = useState<Session[]>([]);
  const inProgressId = home.inProgressSession?.id ?? null;

  // The exercises done before, reloaded as a workout ends (it joins them) and as the app comes back.
  useEffect(() => {
    if (Platform.OS !== 'ios' || !uid) return;
    const load = () => sessionRepository.listCompleted(uid).then(setHistory).catch(() => undefined);
    load();
    const sub = AppState.addEventListener('change', s => s === 'active' && load());
    return () => sub.remove();
  }, [uid, inProgressId]);

  const lastSent = useRef('');
  useEffect(() => {
    if (Platform.OS !== 'ios' || !uid || home.loading) return;
    const built = buildWatchHome({
      plan: home.plan,
      cycle: home.cycle,
      todayDate: home.todayDate,
      todayOccurrence: home.todayOccurrence,
      upcoming: home.upcoming,
      inProgress: home.inProgressSession,
      cycleFinished: home.cycleFinished,
      history,
      unit,
    });
    const json = JSON.stringify(built);
    if (json === lastSent.current) return;
    lastSent.current = json;
    liveActivity.setWatchHome(built);
  }, [uid, home, history, unit]);

  // The latest of everything, for requests that arrive between renders.
  const latest = useRef({ uid, home, unit, profile });
  latest.current = { uid, home, unit, profile };
  const busy = useRef(false);

  useEffect(() => {
    if (Platform.OS !== 'ios' || !uid || home.loading) return;
    const open = (params: AppStackParams['SessionScreen']) => {
      if (navigationRef.isReady()) navigationRef.navigate('SessionScreen', params);
    };
    const handle = async (request: LiveActivityCommand) => {
      // A cardio entry's measured distance is never stale: it fills the entry whenever it comes.
      if (request.kind === 'cardioDistance') {
        const parsed = parseWatchDistance(request.id);
        if (parsed) receiveWatchDistance(parsed.setId, parsed.meters);
        return;
      }
      if (Date.now() - request.at > REQUEST_FRESH_MS) return;
      const { uid: me, home: now, unit: weight } = latest.current;
      if (!me) return;
      if (request.kind === 'search') {
        const query = request.id.trim();
        const found = query ? searchCatalog({ query }).slice(0, SEARCH_RESULTS) : [];
        const label = (e: (typeof found)[number]) => EQUIPMENT_OPTIONS.find(o => o.value === e.equipment)?.label;
        liveActivity.setWatchSearch(request.id, found.map(e => ({ id: e.id, name: e.name, ...(label(e) ? { detail: label(e) } : {}) })));
        return;
      }
      if (busy.current) return;
      busy.current = true;
      try {
        const resume = now.inProgressSession;
        // A workout already going: the Watch's Start, whichever, opens that one rather than a second.
        if (resume) {
          open({ plan: resume.planId && now.plan ? now.plan : null, cycle: resume.cycleId && now.cycle ? now.cycle : null, session: resume });
          return;
        }
        if (request.kind === 'startWorkout') {
          const occurrence = now.cycle?.occurrences.find(o => o.id === request.id);
          if (!now.plan || !now.cycle || !occurrence || occurrence.status !== 'scheduled') return;
          const { session, cycle } = await startWorkoutNow(me, now.plan, now.cycle, occurrence, weight);
          open({ plan: now.plan, cycle, session });
        } else if (request.kind === 'startQuick') {
          let session = await startQuickSession(me);
          const ids = request.id.split(',').filter(Boolean);
          if (ids.length) {
            const past = await sessionRepository.listCompleted(me).catch(() => [] as Session[]);
            for (const id of ids) {
              const exercise = getCatalogExercise(id);
              if (exercise) session = addExerciseTo(session, exercise, null, past, weight, newId).session;
            }
            session = await saveExercises(me, session);
          }
          open({ plan: null, cycle: null, session, activePlan: now.plan ? { plan: now.plan, cycle: now.cycle } : undefined });
        }
      } catch (err) {
        console.warn('watch start failed', err);
      } finally {
        busy.current = false;
      }
    };
    // A request heard live is still in the queue the next drain takes: each is carried out once.
    const run = (r: LiveActivityCommand) => {
      if (takeCommand({ ...r, kind: `watch:${r.kind}` })) handle(r).catch(() => undefined);
    };
    // What came while the app was asleep or still loading, then each as it arrives.
    liveActivity.takeWatchRequests().forEach(run);
    const off = liveActivity.onWatchRequest(run);
    const sub = AppState.addEventListener('change', s => s === 'active' && liveActivity.takeWatchRequests().forEach(run));
    return () => {
      off();
      sub.remove();
    };
  }, [uid, home.loading]);
};
