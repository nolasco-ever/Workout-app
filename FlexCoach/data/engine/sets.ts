import { LoggedSet } from '../models';

/**
 * A working set is one the lifter finished that counts toward volume,
 * records and progression. Warm-up sets are logged like any other set but
 * are excluded from all of those: a 40 kg warm-up before a 100 kg squat is
 * not a 40 kg set for the stats.
 */
export const isWorkingSet = (s: LoggedSet): boolean => s.completed && !s.warmup;

export const workingSets = (sets: LoggedSet[]): LoggedSet[] => sets.filter(isWorkingSet);
