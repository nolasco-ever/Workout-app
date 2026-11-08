import { RoutePoint, parseWatchPoints } from '../engine/route';

/**
 * The Apple Watch's GPS for an outdoor cardio entry (v1 #10.8). When a Watch
 * is tracking, its route is used over the phone's (owner, 2026-11-08): new
 * readings come live every few seconds (`cardioRoutePoints`), and the whole
 * route again when the clock stops (`cardioRoute`, queued so it arrives even
 * if the app wasn't listening). The whole route replaces what came live.
 */
type Listener = (setId: string, points: RoutePoint[], whole: boolean) => void;

const listeners = new Set<Listener>();
/** Whole routes not yet put on their entry, by set id. */
const pendingWhole = new Map<string, RoutePoint[]>();

/** "setId|lat,lon,t,acc;…", as the Watch sends it. */
export const parseWatchRoute = (id: string): { setId: string; points: RoutePoint[] } | null => {
  const at = id.indexOf('|');
  if (at <= 0) return null;
  const points = parseWatchPoints(id.slice(at + 1));
  return points.length ? { setId: id.slice(0, at), points } : null;
};

export const receiveWatchRoute = (setId: string, points: RoutePoint[], whole: boolean): void => {
  if (whole) pendingWhole.set(setId, points);
  listeners.forEach(l => l(setId, points, whole));
};

/** Listens for the Watch's route, starting with any whole routes that came before. */
export const onWatchRoute = (listener: Listener): (() => void) => {
  listeners.add(listener);
  pendingWhole.forEach((points, setId) => listener(setId, points, true));
  return () => listeners.delete(listener);
};

/** The whole route was put on its entry. */
export const takeWatchRoute = (setId: string): void => {
  pendingWhole.delete(setId);
};
