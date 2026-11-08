import { Id, Plan, Schedule, ScheduleDay, WeeklySchedule } from '../models';

/**
 * A stored day in either shape: a list (v1 #10, several items a day) or the
 * single id or null that plans held before.
 */
const toDay = (day: unknown): ScheduleDay =>
  Array.isArray(day) ? day.filter((id): id is Id => typeof id === 'string' && id.length > 0) : typeof day === 'string' && day ? [day] : [];

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
