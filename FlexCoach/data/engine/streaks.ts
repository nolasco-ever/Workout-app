import { LocalDate, Session } from '../models';
import { addDays } from './dates';

/**
 * The Streaks screen's numbers and calendar (build 19 feedback, owner
 * 2026-10-24). A streak is the days in a row with a finished workout; any
 * day without one ends it, rest days included (owner: keep it as it is).
 */

export interface StreakRun {
  length: number;
  start: LocalDate;
  end: LocalDate;
}

export interface StreakSummary {
  /** The run ending today, or yesterday while today is still open; null at zero. */
  current: StreakRun | null;
  /** The longest run anywhere in the history; null with nothing finished. */
  best: StreakRun | null;
}

/** Finished workouts by the day they were done, each day's in the order they started. */
export const trainingDays = (sessions: Session[]): Map<LocalDate, Session[]> => {
  const days = new Map<LocalDate, Session[]>();
  for (const s of [...sessions].filter(s => s.status === 'completed').sort((a, b) => a.startedAt - b.startedAt)) {
    const list = days.get(s.date) ?? [];
    list.push(s);
    days.set(s.date, list);
  }
  return days;
};

/** Every run of consecutive training days, oldest first. */
export const streakRuns = (days: Iterable<LocalDate>): StreakRun[] => {
  const sorted = [...new Set(days)].sort();
  const runs: StreakRun[] = [];
  for (const d of sorted) {
    const last = runs[runs.length - 1];
    if (last && addDays(last.end, 1) === d) {
      last.end = d;
      last.length += 1;
    } else {
      runs.push({ length: 1, start: d, end: d });
    }
  }
  return runs;
};

export const summarizeStreaks = (days: Iterable<LocalDate>, todayDate: LocalDate): StreakSummary => {
  const runs = streakRuns(days);
  const last = runs[runs.length - 1];
  const current = last && (last.end === todayDate || last.end === addDays(todayDate, -1)) ? last : null;
  // The longest; on a tie, the most recent.
  const best = runs.reduce<StreakRun | null>((b, r) => (!b || r.length >= b.length ? r : b), null);
  return { current, best };
};

export interface CalendarMonth {
  year: number;
  /** 0 to 11. */
  month: number;
  /** Rows of seven, Sunday first; null where the row runs into the months either side. */
  weeks: (LocalDate | null)[][];
}

const pad = (n: number) => String(n).padStart(2, '0');

export const calendarMonth = (year: number, month: number): CalendarMonth => {
  const firstWeekday = new Date(year, month, 1).getDay();
  const length = new Date(year, month + 1, 0).getDate();
  const cells: (LocalDate | null)[] = Array.from({ length: firstWeekday }, () => null);
  for (let d = 1; d <= length; d++) cells.push(`${year}-${pad(month + 1)}-${pad(d)}`);
  while (cells.length % 7) cells.push(null);
  const weeks: (LocalDate | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  return { year, month, weeks };
};

/** Every month from the first training day's to today's, oldest first; just today's with no history. */
export const calendarMonths = (firstDay: LocalDate | null, todayDate: LocalDate): CalendarMonth[] => {
  const [ty, tm] = todayDate.split('-').map(Number);
  const [fy, fm] = (firstDay && firstDay < todayDate ? firstDay : todayDate).split('-').map(Number);
  const months: CalendarMonth[] = [];
  for (let y = fy, m = fm - 1; y < ty || (y === ty && m <= tm - 1); m === 11 ? ((y += 1), (m = 0)) : (m += 1)) {
    months.push(calendarMonth(y, m));
  }
  return months;
};
