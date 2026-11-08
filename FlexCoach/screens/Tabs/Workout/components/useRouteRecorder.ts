import { useEffect, useRef, useState } from 'react';
import { PermissionsAndroid, Platform } from 'react-native';
import NativeRouteTracker from '../../../../specs/NativeRouteTracker';
import { appendPoints, decodeRoute, RoutePoint } from '../../../../data/engine/route';
import { onWatchRoute, takeWatchRoute } from '../../../../data/liveActivity/watchRoute';

/** How often the phone's readings are taken from the native side while the clock runs. */
const TAKE_EVERY_MS = 2000;

const askAndroid = async (): Promise<boolean> => {
  if (Platform.OS !== 'android') return true;
  const result = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION);
  return result === PermissionsAndroid.RESULTS.GRANTED;
};

/**
 * The route of an outdoor cardio entry while its clock runs (v1 #10.8). The
 * phone's GPS records by default; as soon as the Watch sends its own readings
 * for the entry, the Watch's route is used instead and the phone stops
 * (owner, 2026-11-08). The Watch's whole route, sent when its clock stops,
 * replaces what came live. A route saved on the entry (an earlier stretch,
 * before a Pause) is the starting point.
 */
export const useRouteRecorder = ({ setId, outdoor, running, saved }: { setId: string | null; outdoor: boolean; running: boolean; saved: { line: string; source: 'phone' | 'watch' } | undefined }) => {
  const [phone, setPhone] = useState<RoutePoint[]>([]);
  const [watch, setWatch] = useState<RoutePoint[] | null>(null);
  const [denied, setDenied] = useState(false);
  const watchRef = useRef(false);
  const seeded = useRef<string | null>(null);

  // What an earlier stretch saved.
  useEffect(() => {
    if (!setId || seeded.current === setId) return;
    seeded.current = setId;
    const points = saved ? decodeRoute(saved.line) : [];
    if (saved?.source === 'watch') {
      watchRef.current = true;
      setWatch(points);
    } else setPhone(points);
    // Only once per entry.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setId]);

  // Location is asked for as soon as an outdoor entry opens, before Start (owner, 2026-11-08).
  useEffect(() => {
    if (!setId || !outdoor || !NativeRouteTracker) return;
    const tracker = NativeRouteTracker;
    let cancelled = false;
    (async () => {
      const ok = (await askAndroid()) && (await tracker.authorize()) === 'granted';
      if (!cancelled) setDenied(!ok);
    })().catch(err => console.warn('location permission failed', err));
    return () => {
      cancelled = true;
    };
  }, [setId, outdoor]);

  // The Watch's readings take over from the phone's.
  useEffect(() => {
    if (!setId || !outdoor) return;
    return onWatchRoute((id, points, whole) => {
      if (id !== setId) return;
      if (!watchRef.current) {
        watchRef.current = true;
        NativeRouteTracker?.stop();
      }
      if (whole) takeWatchRoute(id);
      setWatch(current => (whole ? appendPoints([], points) : appendPoints(current ?? [], points)));
    });
  }, [setId, outdoor]);

  // The phone's GPS while the clock runs, unless the Watch is tracking.
  useEffect(() => {
    if (!setId || !outdoor || !running || !NativeRouteTracker || watchRef.current) return;
    const tracker = NativeRouteTracker;
    let cancelled = false;
    let timer: ReturnType<typeof setInterval> | null = null;
    const take = () => {
      const points = tracker.takePoints();
      if (points.length && !watchRef.current) setPhone(current => appendPoints(current, points));
    };
    (async () => {
      if (!(await askAndroid())) {
        if (!cancelled) setDenied(true);
        return;
      }
      const answer = await tracker.start();
      if (cancelled) {
        tracker.stop();
        return;
      }
      setDenied(answer !== 'granted');
      if (answer === 'granted') timer = setInterval(take, TAKE_EVERY_MS);
    })().catch(err => console.warn('route recording failed', err));
    return () => {
      cancelled = true;
      if (timer) clearInterval(timer);
      tracker.stop();
      take();
    };
  }, [setId, outdoor, running]);

  const usingWatch = watch !== null;
  return { points: usingWatch ? watch : phone, source: (usingWatch ? 'watch' : 'phone') as 'phone' | 'watch', denied };
};
