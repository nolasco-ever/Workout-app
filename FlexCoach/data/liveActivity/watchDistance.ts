/**
 * Distances the Apple Watch measured for cardio entries (v1 #6, step 3), by
 * set id, in meters. The Watch sends one each time the clock stops on an
 * entry (Pause or End), with the total so far; the running workout's screen
 * fills the entry with it. Kept until taken, in case the screen was not
 * listening when it came.
 */
const pending = new Map<string, number>();
const listeners = new Set<(setId: string, meters: number) => void>();

export const receiveWatchDistance = (setId: string, meters: number): void => {
  if (!setId || !(meters > 0)) return;
  pending.set(setId, meters);
  listeners.forEach(l => l(setId, meters));
};

/** Listens for distances, and hands over those that came before. */
export const onWatchDistance = (listener: (setId: string, meters: number) => void): (() => void) => {
  listeners.add(listener);
  pending.forEach((meters, setId) => listener(setId, meters));
  return () => listeners.delete(listener);
};

/** The distance was put on its entry. */
export const takeWatchDistance = (setId: string): void => {
  pending.delete(setId);
};

/** "setId:1234.5", as the Watch sends it. */
export const parseWatchDistance = (id: string): { setId: string; meters: number } | null => {
  const at = id.lastIndexOf(':');
  if (at <= 0) return null;
  const meters = Number(id.slice(at + 1));
  return Number.isFinite(meters) && meters > 0 ? { setId: id.slice(0, at), meters } : null;
};
