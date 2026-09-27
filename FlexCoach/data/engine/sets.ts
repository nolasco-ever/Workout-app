import { LoggedSet } from '../models';

/**
 * A working set is one the lifter finished that counts toward volume,
 * records and progression. Warm-up sets are logged like any other set but
 * are excluded from all of those: a 40 kg warm-up before a 100 kg squat is
 * not a 40 kg set for the stats.
 */
export const isWorkingSet = (s: LoggedSet): boolean => s.completed && !s.warmup;

export const workingSets = (sets: LoggedSet[]): LoggedSet[] => sets.filter(isWorkingSet);

/**
 * Set numbers restart within each group: warm-ups count W1, W2 and working
 * sets count 1, 2, 3 regardless of how many warm-ups sit above them. Called
 * after a set is added or removed so the labels never skip a number.
 */
export const renumberSets = (sets: LoggedSet[]): LoggedSet[] => {
  let warm = 0;
  let work = 0;
  return sets.map(s => {
    const n = s.warmup ? ++warm : ++work;
    return s.setNumber === n ? s : { ...s, setNumber: n };
  });
};
