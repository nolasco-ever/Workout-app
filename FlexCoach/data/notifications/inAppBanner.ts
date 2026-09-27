import { NotificationTarget } from '../models';

/**
 * A notice shown inside the app, at the top of whatever screen is open.
 * Used where a system notification would be wrong because the app is
 * already in front, e.g. the rest timer finishing while the user is on
 * another tab.
 */
export interface InAppBanner {
  id: string;
  title: string;
  body: string;
  /** Where a tap takes the user; the banner just closes without one. */
  target?: NotificationTarget;
  /** How long it stays up; default 6s. */
  durationMs?: number;
}

type Listener = (banner: InAppBanner) => void;
const listeners = new Set<Listener>();
let counter = 0;

export const showInAppBanner = (banner: Omit<InAppBanner, 'id'>): void => {
  const full = { ...banner, id: `banner-${++counter}` };
  listeners.forEach(l => l(full));
};

export const subscribeInAppBanner = (listener: Listener): (() => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};
