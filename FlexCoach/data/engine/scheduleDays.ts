import { Id, Plan, Schedule, ScheduleDay, WeeklySchedule } from '../models';

const ids = (list: unknown[]): ScheduleDay => list.filter((id): id is Id => typeof id === 'string' && id.length > 0);

/**
 * A stored day, read into a list. Firestore can't hold a list inside a list,
 * so each day is stored as `{ ids }` (see `toStoredSchedule`). Plans saved
 * before several items a day (v1 #10) held a single id or null; a bare list
 * is read too, in case one is ever held in memory and passed back.
 */
const toDay = (day: unknown): ScheduleDay => {
  if (Array.isArray(day)) return ids(day);
  if (day && typeof day === 'object' && Array.isArray((day as { ids?: unknown }).ids)) return ids((day as { ids: unknown[] }).ids);
  return typeof day === 'string' && day ? [day] : [];
};

/** A day as Firestore stores it: a map holding the list, never a list inside a list. */
export interface StoredScheduleDay {
  ids: Id[];
}

/** A schedule in the shape it is written in; `normalizeSchedule` reads it back. */
export const toStoredSchedule = (schedule: Schedule): Record<string, unknown> =>
  schedule.mode === 'rotation'
    ? { ...schedule, slots: schedule.slots.map((day): StoredScheduleDay => ({ ids: [...day] })) }
    : { ...schedule, weekdays: schedule.weekdays.map((day): StoredScheduleDay => ({ ids: [...day] })) };

/** A plan ready to write: its schedule in the stored shape. */
export const toStoredPlan = <P extends Partial<Plan>>(plan: P): P => (plan.schedule ? ({ ...plan, schedule: toStoredSchedule(plan.schedule) } as unknown as P) : plan);

/**
 * A schedule as stored, read into today's shape. Plans saved before several
 * items a day held one id or null per day; they read as a one-item or empty
 * day, so nothing needs migrating.
 */
export const normalizeSchedule = (schedule: Schedule): Schedule =>
  schedule.mode === 'rotation'
    ? { ...schedule, slots: (schedule.slots as unknown[]).map(toDay) }
    : { ...schedule, weekdays: Array.from({ length: 7 }, (_, i) => toDay((schedule.weekdays as unknown[])[i])) as WeeklySchedule['weekdays'] };

/** A plan as read from the store; see `normalizeSchedule`. */
export const normalizePlan = <P extends Plan | null>(plan: P): P => (plan && plan.schedule ? { ...plan, schedule: normalizeSchedule(plan.schedule) } : plan);

/** The schedule's days in order: a rotation's slots, or Sunday to Saturday. */
export const scheduleDays = (schedule: Schedule): ScheduleDay[] => (schedule.mode === 'rotation' ? schedule.slots : schedule.weekdays);

/** The same schedule with each day changed by `fn`. */
export const mapScheduleDays = (schedule: Schedule, fn: (day: ScheduleDay) => ScheduleDay): Schedule =>
  schedule.mode === 'rotation'
    ? { ...schedule, slots: schedule.slots.map(fn) }
    : { ...schedule, weekdays: schedule.weekdays.map(fn) as WeeklySchedule['weekdays'] };

/** Every item put on the schedule, once per time it appears. */
export const scheduledIds = (schedule: Schedule): Id[] => scheduleDays(schedule).flat();
