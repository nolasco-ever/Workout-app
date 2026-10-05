import { ClockTime, Cycle, LocalDate } from '../models';
import { addDays, fromLocalDate, toLocalDate } from './dates';

/**
 * When a finished cycle's report becomes available. The report lands two
 * hours after the last workout of the cycle is resolved, so it feels like
 * the numbers took a moment to settle. A finish late at night waits for
 * the next morning's reminder time instead of buzzing at 2 am.
 */

export const REPORT_DELAY_MS = 2 * 60 * 60 * 1000;
/** From this hour on, the report waits for the morning. */
export const LATE_HOUR = 22;

const atTime = (date: LocalDate, time: ClockTime): number => {
  const d = fromLocalDate(date);
  d.setHours(time.hour, time.minute, 0, 0);
  return d.getTime();
};

/** Every workout of the cycle has an outcome: done, skipped, or a rest day. */
export const allResolved = (cycle: Cycle): boolean => cycle.occurrences.every(o => o.status !== 'scheduled' && o.status !== 'in_progress');

/** The report time for a cycle whose last workout was resolved at `finishedAt`. */
export const reportReadyAfter = (finishedAt: number, morning: ClockTime): number => {
  const ready = new Date(finishedAt + REPORT_DELAY_MS);
  const hour = ready.getHours() + ready.getMinutes() / 60;
  const morningHour = morning.hour + morning.minute / 60;
  if (hour < morningHour) return atTime(toLocalDate(ready), morning);
  if (hour >= LATE_HOUR) return atTime(addDays(toLocalDate(ready), 1), morning);
  return ready.getTime();
};

/**
 * Stamp the report time on a cycle the moment its last workout is resolved.
 * Earlier resolutions leave it alone; a stamped cycle keeps its time.
 */
export const settleCycleReport = (cycle: Cycle, now: number, morning: ClockTime): Cycle => {
  if (cycle.reportReadyAt || !allResolved(cycle)) return cycle;
  return { ...cycle, reportReadyAt: reportReadyAfter(now, morning) };
};

/**
 * When this cycle's report is (or will be) ready, or null while workouts
 * are still open. Cycles from before the stamp existed fall back to the
 * morning after their end date.
 */
export const cycleReportReadyAt = (cycle: Cycle, morning: ClockTime): number | null => {
  if (cycle.reportReadyAt) return cycle.reportReadyAt;
  return allResolved(cycle) ? atTime(addDays(cycle.endDate, 1), morning) : null;
};

export const isCycleReportReady = (cycle: Cycle, morning: ClockTime, now: number): boolean => {
  const at = cycleReportReadyAt(cycle, morning);
  return at !== null && at <= now;
};
