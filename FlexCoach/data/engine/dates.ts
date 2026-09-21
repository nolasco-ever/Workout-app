import { LocalDate, Weekday } from '../models';

/** Format a Date as a LocalDate (YYYY-MM-DD) in the device's local time zone. */
export const toLocalDate = (d: Date): LocalDate => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

/** Parse a LocalDate into a Date at local midnight. */
export const fromLocalDate = (s: LocalDate): Date => {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
};

export const today = (): LocalDate => toLocalDate(new Date());

export const addDays = (s: LocalDate, days: number): LocalDate => {
  const d = fromLocalDate(s);
  d.setDate(d.getDate() + days);
  return toLocalDate(d);
};

export const weekdayOf = (s: LocalDate): Weekday => fromLocalDate(s).getDay() as Weekday;

/** Difference in whole days, b - a. */
export const daysBetween = (a: LocalDate, b: LocalDate): number =>
  Math.round((fromLocalDate(b).getTime() - fromLocalDate(a).getTime()) / 86_400_000);

/** LocalDate strings sort lexically, so plain comparison is safe. */
export const isBefore = (a: LocalDate, b: LocalDate): boolean => a < b;
export const isAfter = (a: LocalDate, b: LocalDate): boolean => a > b;

/** The next date on or after `from` that falls on `weekday`. */
export const nextWeekday = (from: LocalDate, weekday: Weekday): LocalDate => {
  const diff = (weekday - weekdayOf(from) + 7) % 7;
  return addDays(from, diff);
};
