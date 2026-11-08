/**
 * The Apple Watch's live numbers for the cardio entry running now (v1
 * #10.6): every few seconds while its clock runs, for the cardio screen.
 * Only the latest reading per entry is kept; nothing is saved, the logged
 * distance still comes with `cardioDistance` when the clock stops.
 */
export interface WatchLive {
  /** Meters so far, or null when the Watch doesn't measure this kind's distance. */
  meters: number | null;
  /** Null before the first reading. */
  bpm: number | null;
  kcal: number;
  /** When it arrived, ms since 1970. */
  at: number;
}

/** A reading older than this reads as no reading: the Watch stopped sending (out of range, workout ended). */
export const WATCH_LIVE_STALE_MS = 15_000;

const latest = new Map<string, WatchLive>();
const listeners = new Set<(setId: string, live: WatchLive) => void>();

/** "setId:meters:bpm:kcal", as the Watch sends it; meters -1 when it doesn't measure distance, bpm 0 before a reading. */
export const parseWatchLive = (id: string, at: number): { setId: string; live: WatchLive } | null => {
  const parts = id.split(':');
  if (parts.length < 4) return null;
  const [meters, bpm, kcal] = parts.slice(-3).map(Number);
  const setId = parts.slice(0, -3).join(':');
  if (!setId || ![meters, bpm, kcal].every(Number.isFinite)) return null;
  return { setId, live: { meters: meters < 0 ? null : meters, bpm: bpm > 0 ? Math.round(bpm) : null, kcal: Math.max(0, Math.round(kcal)), at } };
};

export const receiveWatchLive = (setId: string, live: WatchLive): void => {
  latest.set(setId, live);
  listeners.forEach(l => l(setId, live));
};

/** Listens for readings, starting with the latest one for each entry. */
export const onWatchLive = (listener: (setId: string, live: WatchLive) => void): (() => void) => {
  listeners.add(listener);
  latest.forEach((live, setId) => listener(setId, live));
  return () => listeners.delete(listener);
};

/** The reading if it is still fresh at `now`, else null. */
export const freshWatchLive = (live: WatchLive | null, now: number): WatchLive | null => (live && now - live.at <= WATCH_LIVE_STALE_MS ? live : null);
