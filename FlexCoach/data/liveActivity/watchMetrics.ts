import { AppState } from 'react-native';
import { Id, WatchMetrics } from '../models';
import { sessionRepository } from '../repositories/sessionRepository';
import { liveActivity, WatchMetricsEvent } from './liveActivity';

/**
 * The Apple Watch's numbers for finished workouts (v1 #6): calories and
 * heart rate arrive a moment after Finish, are saved onto the session (so
 * History shows them), and are kept here so the done screen can show them
 * the moment they land.
 */
const known = new Map<Id, WatchMetrics>();
const listeners = new Set<(sessionId: Id, metrics: WatchMetrics) => void>();

/** A heart rate of 0 means the Watch had none. */
export const toWatchMetrics = (e: Pick<WatchMetricsEvent, 'kcal' | 'avgBpm' | 'maxBpm'>): WatchMetrics => ({
  kcal: Math.max(0, Math.round(e.kcal)),
  avgBpm: e.avgBpm > 0 ? Math.round(e.avgBpm) : null,
  maxBpm: e.maxBpm > 0 ? Math.round(e.maxBpm) : null,
});

/** The Watch's stats worth showing: only what it measured, so a workout without a heart rate shows none. */
export const watchStats = (m: WatchMetrics | null | undefined): { label: string; value: string }[] => {
  if (!m) return [];
  const stats: { label: string; value: string }[] = [];
  if (m.kcal > 0) stats.push({ label: 'Calories', value: m.kcal.toLocaleString() });
  if (m.avgBpm !== null) stats.push({ label: 'Avg heart rate', value: `${m.avgBpm} bpm` });
  if (m.maxBpm !== null) stats.push({ label: 'Max heart rate', value: `${m.maxBpm} bpm` });
  return stats;
};

export const watchMetricsFor = (sessionId: Id): WatchMetrics | null => known.get(sessionId) ?? null;

export const onWatchMetrics = (listener: (sessionId: Id, metrics: WatchMetrics) => void): (() => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

const take = (uid: Id, e: WatchMetricsEvent) => {
  const metrics = toWatchMetrics(e);
  known.set(e.sessionId, metrics);
  listeners.forEach(l => l(e.sessionId, metrics));
  sessionRepository.saveWatchMetrics(uid, e.sessionId, metrics).catch(err => console.warn('watch metrics save failed', err));
};

/** Listens for the Watch's numbers while signed in, and picks up any that came while the app was asleep. */
export const startWatchMetricsSync = (uid: Id): (() => void) => {
  const drain = () => liveActivity.takeWatchMetrics().forEach(e => take(uid, e));
  drain();
  const off = liveActivity.onWatchMetrics(e => take(uid, e));
  const sub = AppState.addEventListener('change', state => {
    if (state === 'active') drain();
  });
  return () => {
    off();
    sub.remove();
  };
};
