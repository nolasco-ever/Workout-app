import { Cycle, Id, LocalDate, Occurrence, Plan, ScheduleDay, Workout } from '../models';
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

  // One occurrence per item on a day, in the day's order; an empty day is one rest occurrence.
  const layDay = (day: ScheduleDay, date: LocalDate) => {
    if (day.length === 0) occurrences.push(makeOccurrence(plan, null, date));
    for (const id of day) occurrences.push(makeOccurrence(plan, id, date));
  };

  if (plan.schedule.mode === 'rotation') {
    const { slots, passesPerCycle } = plan.schedule;
    if (slots.length === 0) throw new Error('Rotation schedule has no slots');
    startDate = notBefore;
    let day = 0;
    for (let pass = 0; pass < Math.max(1, passesPerCycle); pass++) {
      for (const slot of slots) {
        layDay(slot, addDays(startDate, day));
        day++;
      }
    }
  } else {
    const { weekdays, startWeekday, weeksPerCycle } = plan.schedule;
    startDate = nextWeekday(notBefore, startWeekday);
    const totalDays = 7 * Math.max(1, weeksPerCycle);
    for (let day = 0; day < totalDays; day++) {
      layDay(weekdays[(startWeekday + day) % 7], addDays(startDate, day));
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

/**
 * The running cycle after its plan's schedule or workouts were edited (owner, 2026-10-24: edits used to close the
 * cycle and start a fresh one from today). Nothing restarts: the days already behind, and any workout done, skipped
 * or under way, stay as they are; the days from today on (from the cycle's start, if it has not begun) are laid out
 * again from the new schedule, on the calendar the cycle already had. The cycle keeps its id, number and start date;
 * its end follows the new layout. A finished cycle is left alone. On a day that keeps an item (done, say), the new
 * schedule's other items for that day are still added; only the kept item isn't laid out twice.
 */
export const rebuildCycle = (cycle: Cycle, plan: Plan, todayDate: LocalDate, now: number = Date.now()): Cycle => {
  if (isCycleFinished(cycle, todayDate)) return cycle;
  const from = cycle.startDate > todayDate ? cycle.startDate : todayDate;
  const settled = (o: Occurrence) => o.date < from || (o.status !== 'scheduled' && o.status !== 'rest');
  const kept = cycle.occurrences.filter(settled);
  const keptItems = kept.filter(o => o.status !== 'rest');
  const takenDates = new Set(keptItems.map(o => o.date));
  const takenItems = new Set(keptItems.map(o => `${o.date}|${o.workoutId}`));
  const fresh = generateCycle(plan, cycle.ownerId, cycle.number, cycle.startDate, now).occurrences.filter(
    o => o.date >= from && (o.workoutId ? !takenItems.has(`${o.date}|${o.workoutId}`) : !takenDates.has(o.date)),
  );
  const occurrences = sortByDate([...kept.filter(o => !(o.status === 'rest' && o.date >= from)), ...fresh]);
  const last = occurrences[occurrences.length - 1];
  return { ...cycle, occurrences, endDate: last ? last.date : cycle.endDate, updatedAt: now };
};

/**
 * Where the cycle after `previous` begins when it is started on `todayDate`.
 *
 * Weekly plans keep their calendar: the next cycle is the block that
 * follows the previous one, even if its start weekday has already gone by.
 * Started on a Wednesday, the cycle that began on Monday still runs from
 * that Monday, and any workout days already past are handled as missed.
 * Only when the whole block has passed does it skip ahead to the block
 * that contains today. Rotation plans have no calendar, so they start on
 * the later of the day after the previous cycle and today.
 */
export const nextCycleStart = (plan: Plan, previous: Pick<Cycle, 'endDate'>, todayDate: LocalDate): LocalDate => {
  const after = addDays(previous.endDate, 1);
  if (plan.schedule.mode !== 'weekly') return after > todayDate ? after : todayDate;
  const length = 7 * Math.max(1, plan.schedule.weeksPerCycle);
  let start = nextWeekday(after, plan.schedule.startWeekday);
  while (addDays(start, length - 1) < todayDate) start = addDays(start, length);
  return start;
};

/** A cycle counts towards the numbering once a workout was actually done in it. */
export const cycleCounts = (cycle: Cycle): boolean => cycle.occurrences.some(o => o.status === 'completed');

/**
 * Cycle numbers count cycles the user trained in, not cycles that were
 * generated. A plan edit that restarts the cycle keeps the number; only a
 * cycle with at least one finished workout moves it on. `previous` is every
 * cycle of the plan so far, in any order.
 */
export const nextCycleNumber = (previous: Cycle[]): number => 1 + previous.filter(cycleCounts).length;

/** The number the cycle after `cycle` gets: one more if anything was done in it, else the same again. */
export const nextCycleNumberAfter = (cycle: Cycle): number => cycle.number + (cycleCounts(cycle) ? 1 : 0);

/**
 * The same rule applied to a plan's stored cycles, oldest first. Returns
 * only the cycles whose number changes, for cycles written before the rule.
 */
export const renumberCycles = (cycles: Cycle[]): Cycle[] => {
  const ordered = [...cycles].sort((a, b) => a.createdAt - b.createdAt || (a.startDate < b.startDate ? -1 : a.startDate > b.startDate ? 1 : 0));
  const changed: Cycle[] = [];
  let n = 1;
  for (const c of ordered) {
    if (c.number !== n) changed.push({ ...c, number: n });
    if (cycleCounts(c)) n++;
  }
  return changed;
};

const sortByDate = (occurrences: Occurrence[]): Occurrence[] =>
  [...occurrences].sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));

/** A day's rest occurrence goes where `vacated` was left empty, or goes altogether if something still sits there. */
const settleRest = (occurrences: Occurrence[], rests: Occurrence[], vacated: LocalDate): Occurrence[] => {
  const vacatedEmpty = !occurrences.some(o => o.date === vacated && o.status !== 'rest');
  const [first, ...extra] = rests;
  if (first && vacatedEmpty) first.date = vacated;
  const drop = new Set((vacatedEmpty ? extra : rests).map(o => o.id));
  return occurrences.filter(o => !drop.has(o.id));
};

/**
 * Push a day to the following day (v1 #10: the day moves, not one workout).
 * Everything still scheduled on `date` moves together; what is done, skipped
 * or under way stays put.
 *
 * If the next day is a rest day, the rest day takes the day left behind
 * (or goes, when something done is still there). If it holds scheduled
 * items, they are pushed as well, cascading forward. For rotation plans the
 * cycle simply grows. For weekly plans the cycle boundary is fixed, so
 * anything that would land past the end date is marked skipped with reason
 * 'pushed_out'.
 */
export const pushDay = (cycle: Cycle, plan: Plan, date: LocalDate, now: number = Date.now()): Cycle => {
  let occurrences = cycle.occurrences.map(o => ({ ...o }));
  let moving = occurrences.filter(o => o.date === date && o.status === 'scheduled');
  if (moving.length === 0) throw new Error(`Nothing scheduled on ${date} to push`);

  const fixedEnd = plan.schedule.mode === 'weekly' ? cycle.endDate : null;
  // The first vacated date is where a displaced rest day ends up, so the
  // whole run of days shifts by one and the rest day fills the gap.
  const vacated = date;

  while (moving.length > 0) {
    const targetDate = addDays(moving[0].date, 1);
    if (fixedEnd && targetDate > fixedEnd) {
      for (const m of moving) {
        m.status = 'skipped';
        m.skipReason = 'pushed_out';
        m.pushCount += 1;
      }
      break;
    }
    const movingIds = new Set(moving.map(o => o.id));
    const onTarget = occurrences.filter(o => !movingIds.has(o.id) && o.date === targetDate);
    for (const m of moving) {
      m.date = targetDate;
      m.pushCount += 1;
    }
    const rests = onTarget.filter(o => o.status === 'rest');
    if (rests.length > 0) occurrences = settleRest(occurrences, rests, vacated);
    // Done or skipped items keep their date and the pushed day shares it; scheduled ones move on in turn.
    moving = onTarget.filter(o => o.status === 'scheduled');
  }

  const sorted = sortByDate(occurrences);
  const endDate = fixedEnd ?? sorted[sorted.length - 1].date;
  return { ...cycle, occurrences: sorted, endDate, updatedAt: now };
};

/**
 * Move a day to `targetDate` (the missed sheet's "Move to"): everything
 * still scheduled on `fromDate` goes there together. Scheduled items already
 * on the target day are pushed forward first, cascading, so the two days
 * never merge; a rest day there takes the day left behind.
 */
export const moveDayToDate = (cycle: Cycle, plan: Plan, fromDate: LocalDate, targetDate: LocalDate, now: number = Date.now()): Cycle => {
  if (fromDate === targetDate) return cycle;
  const ids = new Set(cycle.occurrences.filter(o => o.date === fromDate && o.status === 'scheduled').map(o => o.id));
  if (ids.size === 0) throw new Error(`Nothing scheduled on ${fromDate} to move`);
  const cleared = cycle.occurrences.some(o => o.date === targetDate && o.status === 'scheduled') ? pushDay(cycle, plan, targetDate, now) : cycle;
  let occurrences = cleared.occurrences.map(o => ({ ...o }));
  for (const o of occurrences) if (ids.has(o.id)) o.date = targetDate;
  const rests = occurrences.filter(o => o.date === targetDate && o.status === 'rest');
  if (rests.length > 0) occurrences = settleRest(occurrences, rests, fromDate);
  const sorted = sortByDate(occurrences);
  const endDate = cleared.endDate > sorted[sorted.length - 1].date ? cleared.endDate : sorted[sorted.length - 1].date;
  return { ...cleared, occurrences: sorted, endDate, updatedAt: now };
};

/**
 * Bring one scheduled item forward (or back) to `targetDate`, typically
 * today, because the user wants to do it now (owner, 2026-11-08: the day's
 * other items stay where they are). It joins whatever is already on that
 * date. A rest day there takes the moved item's old day if that is now
 * empty, or goes.
 */
export const moveOccurrenceToDate = (cycle: Cycle, occurrenceId: Id, targetDate: LocalDate, now: number = Date.now()): Cycle => {
  let occurrences = cycle.occurrences.map(o => ({ ...o }));
  const moving = occurrences.find(o => o.id === occurrenceId);
  if (!moving) throw new Error(`Occurrence ${occurrenceId} not found`);
  if (moving.status !== 'scheduled') throw new Error(`Only scheduled workouts can be moved (status: ${moving.status})`);
  if (moving.date === targetDate) return cycle;
  const fromDate = moving.date;
  moving.date = targetDate;
  const rests = occurrences.filter(o => o.date === targetDate && o.status === 'rest');
  if (rests.length > 0) occurrences = settleRest(occurrences, rests, fromDate);
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

/**
 * Where today sits in the cycle, counting days (dates), not items: a day with
 * three items is still one day (v1 #10). `day` is null before the cycle
 * starts and after its last day.
 */
export const cycleDayPosition = (cycle: Cycle, todayDate: LocalDate): { day: number | null; of: number } => {
  const dates = [...new Set(cycle.occurrences.map(o => o.date))].sort();
  const index = dates.findIndex(d => d >= todayDate);
  return { day: todayDate < cycle.startDate || index === -1 ? null : index + 1, of: dates.length };
};

/** Everything on a given day, in the day's order; rest days give none. */
export const getOccurrencesForDate = (cycle: Cycle, date: LocalDate): Occurrence[] =>
  cycle.occurrences.filter(o => o.date === date && o.status !== 'rest');

/**
 * The one item a single "today" card shows (owner, 2026-11-08): the one under
 * way, else the next not yet done, else the day's last, so a finished day
 * still shows what was done.
 */
export const focusOccurrence = (day: Occurrence[]): Occurrence | undefined =>
  day.find(o => o.status === 'in_progress') ?? day.find(o => o.status === 'scheduled') ?? day[day.length - 1];

/** The item a day's card shows; see `focusOccurrence`. */
export const getOccurrenceForDate = (cycle: Cycle, date: LocalDate): Occurrence | undefined => focusOccurrence(getOccurrencesForDate(cycle, date));

/**
 * Workouts whose date has passed without being started. The UI asks the user
 * to skip or push each of these before showing today's workout.
 */
export const getOverdueOccurrences = (cycle: Cycle, todayDate: LocalDate): Occurrence[] =>
  sortByDate(cycle.occurrences.filter(o => o.status === 'scheduled' && o.date < todayDate));

/**
 * Which missed day to ask about, and what to do with the rest. A missed day
 * is handled as a whole (v1 #10). When several days are overdue only the
 * most recent one is worth a decision: everything on the older days is
 * marked skipped (reason 'missed') and the latest day's items get
 * `missedPromptedAt` so the sheet shows once. `ask` is that day's missed
 * items in order, or null (cycle unchanged) when there is nothing new to ask.
 */
export const resolveMissed = (cycle: Cycle, todayDate: LocalDate, now: number = Date.now()): { cycle: Cycle; ask: Occurrence[] | null; skipped: Occurrence[] } => {
  const overdue = getOverdueOccurrences(cycle, todayDate);
  const latestDate = overdue[overdue.length - 1]?.date;
  const latest = overdue.filter(o => o.date === latestDate);
  if (latest.length === 0 || latest.some(o => o.missedPromptedAt)) return { cycle, ask: null, skipped: [] };
  const latestIds = new Set(latest.map(o => o.id));
  const olderIds = new Set(overdue.filter(o => o.date !== latestDate).map(o => o.id));
  const occurrences = cycle.occurrences.map(o =>
    olderIds.has(o.id) ? { ...o, status: 'skipped' as const, skipReason: 'missed' as const } : latestIds.has(o.id) ? { ...o, missedPromptedAt: now } : o,
  );
  const next = { ...cycle, occurrences, updatedAt: now };
  return { cycle: next, ask: next.occurrences.filter(o => latestIds.has(o.id)), skipped: next.occurrences.filter(o => olderIds.has(o.id)) };
};

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
