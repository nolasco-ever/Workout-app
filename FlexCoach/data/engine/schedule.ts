import { Cycle, Id, LocalDate, Occurrence, Plan, Workout } from '../models';
import { addDays, nextWeekday } from './dates';
import { newId } from './ids';

const workoutName = (plan: Plan, id: Id | null): string | null =>
  id ? plan.workouts.find(w => w.id === id)?.name ?? null : null;

const makeOccurrence = (plan: Plan, workoutId: Id | null, date: LocalDate): Occurrence => ({
  id: newId(),
  workoutId,
  workoutName: workoutName(plan, workoutId),
  date,
  originalDate: date,
  status: workoutId ? 'scheduled' : 'rest',
  pushCount: 0,
  skipReason: null,
  sessionId: null,
});

/**
 * Materialise a new cycle for a plan.
 *
 * Rotation plans start on `notBefore` exactly. Weekly plans start on the
 * first `startWeekday` on or after `notBefore`, so a plan activated on a
 * Wednesday with a Monday start begins the following Monday.
 */
export const generateCycle = (
  plan: Plan,
  ownerId: Id,
  number: number,
  notBefore: LocalDate,
  now: number = Date.now(),
): Cycle => {
  const occurrences: Occurrence[] = [];
  let startDate: LocalDate;

  if (plan.schedule.mode === 'rotation') {
    const { slots, passesPerCycle } = plan.schedule;
    if (slots.length === 0) throw new Error('Rotation schedule has no slots');
    startDate = notBefore;
    let day = 0;
    for (let pass = 0; pass < Math.max(1, passesPerCycle); pass++) {
      for (const slot of slots) {
        occurrences.push(makeOccurrence(plan, slot, addDays(startDate, day)));
        day++;
      }
    }
  } else {
    const { weekdays, startWeekday, weeksPerCycle } = plan.schedule;
    startDate = nextWeekday(notBefore, startWeekday);
    const totalDays = 7 * Math.max(1, weeksPerCycle);
    for (let day = 0; day < totalDays; day++) {
      const date = addDays(startDate, day);
      const weekday = (startWeekday + day) % 7;
      occurrences.push(makeOccurrence(plan, weekdays[weekday], date));
    }
  }

  return {
    id: newId(),
    ownerId,
    planId: plan.id,
    number,
    startDate,
    endDate: occurrences[occurrences.length - 1].date,
    status: 'active',
    occurrences,
    createdAt: now,
    updatedAt: now,
  };
};

const sortByDate = (occurrences: Occurrence[]): Occurrence[] =>
  [...occurrences].sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));

/**
 * Push a missed (or upcoming) workout to the following day.
 *
 * If the next day holds a rest occurrence the two swap places. If it holds
 * another workout, that workout is pushed as well, cascading forward. For
 * rotation plans the cycle simply grows. For weekly plans the cycle boundary
 * is fixed, so any workout that would land past the end date is marked
 * skipped with reason 'pushed_out'.
 */
export const pushOccurrence = (cycle: Cycle, plan: Plan, occurrenceId: Id, now: number = Date.now()): Cycle => {
  const occurrences = cycle.occurrences.map(o => ({ ...o }));
  const start = occurrences.find(o => o.id === occurrenceId);
  if (!start) throw new Error(`Occurrence ${occurrenceId} not found`);
  if (start.status !== 'scheduled') throw new Error(`Only scheduled workouts can be pushed (status: ${start.status})`);

  const fixedEnd = plan.schedule.mode === 'weekly' ? cycle.endDate : null;
  let moving: Occurrence | undefined = start;
  // The first vacated date is where a displaced rest day ends up, so the
  // whole run of workouts shifts by one day and the rest day fills the gap.
  const vacated = start.date;

  while (moving) {
    const targetDate = addDays(moving.date, 1);
    if (fixedEnd && targetDate > fixedEnd) {
      moving.status = 'skipped';
      moving.skipReason = 'pushed_out';
      moving.pushCount += 1;
      break;
    }
    const collision = occurrences.find(o => o.id !== moving!.id && o.date === targetDate);
    moving.date = targetDate;
    moving.pushCount += 1;
    if (!collision) {
      moving = undefined;
    } else if (collision.status === 'rest') {
      collision.date = vacated;
      moving = undefined;
    } else if (collision.status === 'scheduled') {
      moving = collision;
    } else {
      // Completed or skipped days keep their date; the pushed workout shares it.
      moving = undefined;
    }
  }

  const sorted = sortByDate(occurrences);
  const endDate = fixedEnd ?? sorted[sorted.length - 1].date;
  return { ...cycle, occurrences: sorted, endDate, updatedAt: now };
};

/**
 * Bring a scheduled workout forward (or back) to `targetDate`, typically
 * today, because the user wants to do it now. If a scheduled workout or a
 * rest day already sits on that date the two swap places, so the cycle keeps
 * the same set of days. If that date already holds a completed or in-progress
 * workout, the moved one simply shares the date.
 */
export const moveOccurrenceToDate = (cycle: Cycle, occurrenceId: Id, targetDate: LocalDate, now: number = Date.now()): Cycle => {
  const occurrences = cycle.occurrences.map(o => ({ ...o }));
  const moving = occurrences.find(o => o.id === occurrenceId);
  if (!moving) throw new Error(`Occurrence ${occurrenceId} not found`);
  if (moving.status !== 'scheduled') throw new Error(`Only scheduled workouts can be moved (status: ${moving.status})`);
  if (moving.date === targetDate) return cycle;
  const occupant = occurrences.find(o => o.id !== occurrenceId && o.date === targetDate && (o.status === 'scheduled' || o.status === 'rest'));
  if (occupant) occupant.date = moving.date;
  moving.date = targetDate;
  const sorted = sortByDate(occurrences);
  const endDate = cycle.endDate > sorted[sorted.length - 1].date ? cycle.endDate : sorted[sorted.length - 1].date;
  return { ...cycle, occurrences: sorted, endDate, updatedAt: now };
};

export const skipOccurrence = (cycle: Cycle, occurrenceId: Id, now: number = Date.now()): Cycle => {
  const occurrences = cycle.occurrences.map(o =>
    o.id === occurrenceId && o.status === 'scheduled'
      ? { ...o, status: 'skipped' as const, skipReason: 'user' as const }
      : o,
  );
  return { ...cycle, occurrences, updatedAt: now };
};

export const markOccurrence = (
  cycle: Cycle,
  occurrenceId: Id,
  status: 'in_progress' | 'completed',
  sessionId: Id,
  now: number = Date.now(),
): Cycle => ({
  ...cycle,
  occurrences: cycle.occurrences.map(o => (o.id === occurrenceId ? { ...o, status, sessionId } : o)),
  updatedAt: now,
});

/** The workout scheduled for a given day, if any. */
export const getOccurrenceForDate = (cycle: Cycle, date: LocalDate): Occurrence | undefined =>
  cycle.occurrences.find(o => o.date === date && o.status !== 'rest');

/**
 * Workouts whose date has passed without being started. The UI asks the user
 * to skip or push each of these before showing today's workout.
 */
export const getOverdueOccurrences = (cycle: Cycle, todayDate: LocalDate): Occurrence[] =>
  sortByDate(cycle.occurrences.filter(o => o.status === 'scheduled' && o.date < todayDate));

export const getUpcomingOccurrences = (cycle: Cycle, todayDate: LocalDate): Occurrence[] =>
  sortByDate(cycle.occurrences.filter(o => o.status === 'scheduled' && o.date > todayDate));

/** True once no occurrence in the cycle can still be acted on. */
export const isCycleFinished = (cycle: Cycle, todayDate: LocalDate): boolean =>
  todayDate > cycle.endDate && cycle.occurrences.every(o => o.status !== 'scheduled' && o.status !== 'in_progress');

/**
 * Close a cycle: anything still scheduled becomes skipped with reason
 * 'cycle_ended'. Returns the closed cycle and the date the next one may start.
 */
export const closeCycle = (cycle: Cycle, now: number = Date.now()): { cycle: Cycle; nextStart: LocalDate } => {
  const occurrences = cycle.occurrences.map(o =>
    o.status === 'scheduled' ? { ...o, status: 'skipped' as const, skipReason: 'cycle_ended' as const } : o,
  );
  return {
    cycle: { ...cycle, occurrences, status: 'completed', updatedAt: now },
    nextStart: addDays(cycle.endDate, 1),
  };
};

export const findWorkout = (plan: Plan, workoutId: Id | null): Workout | undefined =>
  workoutId ? plan.workouts.find(w => w.id === workoutId) : undefined;
