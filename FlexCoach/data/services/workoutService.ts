import { catalogName } from '../catalog/exerciseCatalog';
import {
  ExerciseKind,
  Cycle,
  CycleSummary,
  Id,
  LocalDate,
  LoggedSet,
  Occurrence,
  PersonalRecord,
  Plan,
  PublicProfile,
  Session,
  UserProfile,
  WeightUnit,
} from '../models';
import { addDays, today } from '../engine/dates';
import { newId } from '../engine/ids';
import {
  closeCycle,
  nextCycleStart,
  findWorkout,
  generateCycle,
  markOccurrence,
  moveDayToDate,
  moveOccurrenceToDate,
  resolveMissed,
  nextCycleNumberAfter,
  pushDay,
  renumberCycles,
  skipOccurrence,
} from '../engine/schedule';
import { ExerciseProgression, progressPlan, roundWarmupKg, targetsForCycle } from '../engine/progression';
import { renumberSets } from '../engine/sets';
import { settleCycleReport } from '../engine/cycleReport';
import { withPrefDefaults } from '../engine/notifications';
import { countWorkingSets, findPersonalRecords, summarizeCycle, totalVolumeKg } from '../engine/stats';
import { cycleRepository } from '../repositories/cycleRepository';
import { planRepository } from '../repositories/planRepository';
import { sessionRepository } from '../repositories/sessionRepository';
import { userRepository } from '../repositories/userRepository';
import { buildSamplePlan } from './samplePlan';
import { activatePlan } from './planService';
import { afterCycleFinished, afterSessionFinished, afterWorkoutPushed, afterWorkoutSkipped } from './buddyService';
import { judgeAchievements } from './achievementService';
import { features } from '../../config/features';

/**
 * Use-case layer for the Workout tab. Screens call these; they compose the
 * pure engines with the repositories and keep the profile's active ids in
 * step. Nothing here holds state.
 */


/** Development helper: write and activate the sample plan for this user. */
export const seedSamplePlan = async (uid: Id): Promise<{ plan: Plan; cycle: Cycle }> => {
  const plan = buildSamplePlan(uid);
  const cycle = await activatePlan(uid, plan);
  return { plan, cycle };
};

/** What is still scheduled on a day: what moves or is skipped when the day does. */
const scheduledOn = (cycle: Cycle, date: LocalDate): Occurrence[] => cycle.occurrences.filter(o => o.date === date && o.status === 'scheduled');

const tellBuddiesMoved = (uid: Id, profile: UserProfile | null, before: Cycle, after: Cycle, ids: Id[]) => {
  if (after === before) return;
  for (const id of ids) {
    const moved = after.occurrences.find(o => o.id === id);
    if (moved) afterWorkoutPushed(uid, profile, moved, moved.date).catch(err => console.warn('buddy activity failed', err));
  }
};

/**
 * Push a day forward until it lands on `targetDate` (tomorrow for "Not
 * today", today for a missed day). The day moves, not one workout (v1 #10):
 * everything still scheduled on it goes together, and each step cascades
 * through the engine, so anything in the way moves too. Stops early if it
 * gets pushed out of a weekly cycle.
 */
export const pushDayTo = async (uid: Id, plan: Plan, cycle: Cycle, date: LocalDate, targetDate: LocalDate, profile: UserProfile | null = null): Promise<Cycle> => {
  const ids = scheduledOn(cycle, date).map(o => o.id);
  let updated = cycle;
  for (let guard = 0; guard < 60; guard++) {
    const occ = updated.occurrences.find(o => o.id === ids[0]);
    if (!occ || occ.status !== 'scheduled' || occ.date >= targetDate) break;
    updated = pushDay(updated, plan, occ.date);
  }
  await cycleRepository.save(uid, updated);
  tellBuddiesMoved(uid, profile, cycle, updated, ids);
  return updated;
};

/** Skip everything still scheduled on a day, for this cycle ("Not today", the missed sheet). */
export const skipDay = async (uid: Id, cycle: Cycle, date: LocalDate, profile: UserProfile | null = null): Promise<Cycle> => {
  const items = scheduledOn(cycle, date);
  const skipped = items.reduce((c, o) => skipOccurrence(c, o.id), cycle);
  const updated = settleCycleReport(skipped, Date.now(), withPrefDefaults(profile?.notifications).morningTime);
  await cycleRepository.save(uid, updated);
  for (const o of items) {
    const occ = updated.occurrences.find(u => u.id === o.id);
    if (occ) afterWorkoutSkipped(uid, profile, occ).catch(err => console.warn('buddy activity failed', err));
  }
  return updated;
};

/**
 * Start a session for an occurrence. `unit` only affects how suggested and
 * warm-up weights are rounded; everything is stored in kilograms.
 */
export const startSession = async (uid: Id, plan: Plan, cycle: Cycle, occurrence: Occurrence, unit: WeightUnit = 'lb'): Promise<{ session: Session; cycle: Cycle }> => {
  const workout = findWorkout(plan, occurrence.workoutId);
  if (!workout) throw new Error('Occurrence has no workout');
  // Targets are fixed for the cycle: what the previous cycle earned.
  const history = await sessionRepository.listCompleted(uid);
  const targets = targetsForCycle(plan, cycle, history, unit);
  const now = Date.now();
  const session: Session = {
    id: newId(),
    ownerId: uid,
    planId: plan.id,
    cycleId: cycle.id,
    occurrenceId: occurrence.id,
    workoutId: workout.id,
    workoutName: workout.name,
    date: today(),
    startedAt: now,
    finishedAt: null,
    status: 'in_progress',
    // Under the library's current names: an old plan's "Air Bike" starts today's session as "Bicycle Crunch".
    exercises: buildWorkoutExercises(workout, entry => targets.get(entry.id)?.target ?? null, [], { id: '' }, unit, newId, true).map(ex => ({ ...ex, exerciseName: catalogName(ex.exerciseId, ex.exerciseName) })),
    createdAt: now,
    updatedAt: now,
  };
  await sessionRepository.save(uid, session);
  const updatedCycle = markOccurrence(cycle, occurrence.id, 'in_progress', session.id);
  await cycleRepository.save(uid, updatedCycle);
  return { session, cycle: updatedCycle };
};

/**
 * Copy one of the plan's workouts into an empty quick workout. Targets are
 * the cycle's when one is running, else each exercise starts from the
 * user's last log of it. The session stays outside the plan.
 */
export const copyWorkoutIntoQuickSession = async (uid: Id, session: Session, plan: Plan, cycle: Cycle | null, workoutId: Id, unit: WeightUnit): Promise<Session> => {
  const workout = findWorkout(plan, workoutId);
  if (!workout) throw new Error('Unknown workout');
  const history = await sessionRepository.listCompleted(uid);
  const targets = cycle ? targetsForCycle(plan, cycle, history, unit) : null;
  const next = fillFromWorkout(session, workout, entry => targets?.get(entry.id)?.target ?? null, history, unit, newId);
  return sessionRepository.saveExercises(uid, next);
};

/** Start a workout outside the plan, empty; exercises are added as it goes. `kind`, picked first (v1 #10), limits what can be added; the Watch starts one without. */
export const startQuickSession = async (uid: Id, kind?: ExerciseKind): Promise<Session> => {
  const session = newQuickSession(uid, today(), newId, Date.now(), kind);
  await sessionRepository.save(uid, session);
  return session;
};

/**
 * Reschedule a day to a chosen date (the missed sheet). Everything still
 * scheduled on it moves together. A rest day there swaps into the vacated
 * day; scheduled items already there are pushed forward first (cascading,
 * like a missed day), so nothing lands in the past. Buddies see each as moved.
 */
export const moveDayTo = async (uid: Id, plan: Plan, cycle: Cycle, date: LocalDate, targetDate: LocalDate, profile: UserProfile | null = null): Promise<Cycle> => {
  const ids = scheduledOn(cycle, date).map(o => o.id);
  const current = moveDayToDate(cycle, plan, date, targetDate);
  await cycleRepository.save(uid, current);
  tellBuddiesMoved(uid, profile, cycle, current, ids);
  return current;
};

/** What a day holds for the move picker: its scheduled items, or a rest day, or nothing. */
export const occupantsOn = (cycle: Cycle, date: LocalDate): { items: Occurrence[]; rest: boolean } => ({
  items: scheduledOn(cycle, date),
  rest: cycle.occurrences.some(o => o.date === date && o.status === 'rest'),
});

/**
 * The missed-workout sheet's first step: skip everything on the older
 * missed days, flag the latest missed day as asked, save, and hand that
 * day's items back. Null when there is nothing new to ask about.
 */
export const beginMissedPrompt = async (uid: Id, cycle: Cycle, todayDate: LocalDate): Promise<{ cycle: Cycle; ask: Occurrence[]; skipped: Occurrence[] } | null> => {
  const result = resolveMissed(cycle, todayDate);
  if (!result.ask) return null;
  await cycleRepository.save(uid, result.cycle);
  return { cycle: result.cycle, ask: result.ask, skipped: result.skipped };
};

/**
 * Start a workout regardless of the day it was scheduled for. A future one
 * moves to today on its own; the rest of its day stays put (owner,
 * 2026-11-08). A missed one brings its whole day forward to today,
 * cascading anything in its way. Today's just starts.
 */
export const startWorkoutNow = async (uid: Id, plan: Plan, cycle: Cycle, occurrence: Occurrence, unit: WeightUnit = 'lb'): Promise<{ session: Session; cycle: Cycle }> => {
  const todayDate = today();
  let current = cycle;
  if (occurrence.date > todayDate) {
    current = moveOccurrenceToDate(cycle, occurrence.id, todayDate);
    await cycleRepository.save(uid, current);
  } else if (occurrence.date < todayDate) {
    current = await pushDayTo(uid, plan, cycle, occurrence.date, todayDate);
  }
  const moved = current.occurrences.find(o => o.id === occurrence.id);
  if (!moved || moved.status !== 'scheduled') throw new Error('Workout could not be scheduled for today');
  return startSession(uid, plan, current, moved, unit);
};

export const logSet = (uid: Id, session: Session, sessionExerciseId: Id, set: LoggedSet): Promise<Session> =>
  sessionRepository.logSet(uid, session, sessionExerciseId, set);

/** Append a set to an exercise mid-session, copied from the last one. Working sets number on from the last working set. */
export const addSetTo = (session: Session, sessionExerciseId: Id, makeId: () => Id): { session: Session; set: LoggedSet } => {
  const ex = session.exercises.find(e => e.id === sessionExerciseId);
  if (!ex) throw new Error('Unknown session exercise');
  const last = ex.sets[ex.sets.length - 1];
  const base: LoggedSet = last ?? { id: '', setNumber: 0, weightKg: ex.target.weightKg, reps: ex.target.reps, durationSec: ex.target.durationSec, distanceM: ex.target.distanceM, completed: false, completedAt: null };
  const set: LoggedSet = { ...base, id: makeId(), warmup: false, completed: false, completedAt: null };
  const sets = renumberSets([...ex.sets, set]);
  return {
    session: { ...session, exercises: session.exercises.map(e => (e.id === ex.id ? { ...e, sets } : e)) },
    set: sets[sets.length - 1],
  };
};

/**
 * Add a warm-up set below the existing warm-ups: a copy of the last one, or
 * half the first working weight for eight reps when there are none yet.
 */
export const addWarmupSetTo = (session: Session, sessionExerciseId: Id, unit: WeightUnit, makeId: () => Id): { session: Session; set: LoggedSet } => {
  const ex = session.exercises.find(e => e.id === sessionExerciseId);
  if (!ex) throw new Error('Unknown session exercise');
  const warmups = ex.sets.filter(s => s.warmup);
  const lastWarmup = warmups[warmups.length - 1];
  const working = ex.sets.find(s => !s.warmup);
  const weightKg = lastWarmup ? lastWarmup.weightKg : working?.weightKg ? roundWarmupKg(working.weightKg * 0.5, unit) : null;
  const set: LoggedSet = { id: makeId(), setNumber: 0, weightKg, reps: lastWarmup?.reps ?? 8, durationSec: null, distanceM: null, completed: false, completedAt: null, warmup: true };
  const sets = renumberSets([...warmups, set, ...ex.sets.filter(s => !s.warmup)]);
  return {
    session: { ...session, exercises: session.exercises.map(e => (e.id === ex.id ? { ...e, sets } : e)) },
    set: sets[warmups.length],
  };
};


export { addExerciseTo, removeExerciseFrom, isQuickSession, substituteExercise } from '../engine/sessionExtras';
import { buildWorkoutExercises, fillFromWorkout, newQuickSession } from '../engine/sessionExtras';

export const saveExercises = (uid: Id, session: Session): Promise<Session> => sessionRepository.saveExercises(uid, session);

/** Drop a set from an exercise mid-session; the remaining sets close the gap in their numbering. */
export const removeSetFrom = (session: Session, sessionExerciseId: Id, setId: Id): Session => ({
  ...session,
  exercises: session.exercises.map(e => (e.id === sessionExerciseId ? { ...e, sets: renumberSets(e.sets.filter(s => s.id !== setId)) } : e)),
});

export const saveSets = (uid: Id, session: Session, sessionExerciseId: Id): Promise<Session> => {
  const ex = session.exercises.find(e => e.id === sessionExerciseId);
  if (!ex) throw new Error('Unknown session exercise');
  return sessionRepository.saveSets(uid, session, sessionExerciseId, ex.sets);
};

export interface SessionResult {
  session: Session;
  /** Null for a quick workout, which has no cycle. */
  cycle: Cycle | null;
  durationSec: number;
  volumeKg: number;
  setsCompleted: number;
  personalRecords: PersonalRecord[];
}

export const finishSession = async (uid: Id, profile: UserProfile | null, session: Session, cycle: Cycle | null): Promise<SessionResult> => {
  const finished = await sessionRepository.finish(uid, session, 'completed');
  const marked = cycle && session.occurrenceId ? markOccurrence(cycle, session.occurrenceId, 'completed', session.id) : cycle;
  // The last workout of the cycle also sets when its report lands.
  const updatedCycle = marked ? settleCycleReport(marked, Date.now(), withPrefDefaults(profile?.notifications).morningTime) : marked;
  if (updatedCycle && updatedCycle !== cycle) await cycleRepository.save(uid, updatedCycle);

  const completed = await sessionRepository.listCompleted(uid);
  const history = completed.filter(s => s.id !== session.id);
  const personalRecords = findPersonalRecords([finished], history);
  afterSessionFinished(uid, profile, finished, personalRecords, profile?.weightUnit ?? 'lb')
    .catch(err => console.warn('buddy update failed', err))
    // Badges are judged once the workout is in the books, never mid-session.
    .then(() => (features.achievements ? judgeAchievements(uid, profile, { sessionId: session.id }) : undefined))
    .catch(err => console.warn('achievement judging failed', err));

  return {
    session: finished,
    cycle: updatedCycle,
    durationSec: Math.round(((finished.finishedAt ?? Date.now()) - finished.startedAt) / 1000),
    volumeKg: totalVolumeKg([finished]),
    setsCompleted: countWorkingSets([finished]),
    personalRecords,
  };
};

export const abandonSession = async (uid: Id, session: Session, cycle: Cycle | null): Promise<Cycle | null> => {
  await sessionRepository.finish(uid, session, 'abandoned');
  if (!cycle || !session.occurrenceId) return cycle;
  const updated: Cycle = {
    ...cycle,
    occurrences: cycle.occurrences.map(o => (o.id === session.occurrenceId ? { ...o, status: 'scheduled' as const, sessionId: null } : o)),
    updatedAt: Date.now(),
  };
  await cycleRepository.save(uid, updated);
  return updated;
};

export interface CycleReview {
  summary: CycleSummary;
  /** Completed sessions logged in the cycle, oldest first. */
  sessions: Session[];
  volumeKg: number;
  durationSec: number;
  setsCompleted: number;
  /** What each exercise's target becomes next cycle, judged from this one. */
  nextTargets: ExerciseProgression[];
}

export const getCycleReview = async (uid: Id, plan: Plan, cycle: Cycle, unit: WeightUnit = 'lb'): Promise<CycleReview> => {
  const all = await sessionRepository.listCompleted(uid);
  const inCycle = all.filter(s => s.cycleId === cycle.id);
  const before = all.filter(s => s.cycleId !== cycle.id && s.date < cycle.startDate);
  return {
    summary: summarizeCycle(cycle, inCycle, before),
    sessions: inCycle,
    volumeKg: totalVolumeKg(inCycle),
    durationSec: inCycle.reduce((n, s) => n + Math.max(0, Math.round(((s.finishedAt ?? s.startedAt) - s.startedAt) / 1000)), 0),
    setsCompleted: countWorkingSets(inCycle),
    nextTargets: progressPlan(plan, all, cycle.id, unit),
  };
};

/** The cycle and its plan by id, for a review opened from a notification or the feed. */
export const loadCycleForReview = async (uid: Id, cycleId: Id): Promise<{ plan: Plan; cycle: Cycle } | null> => {
  const cycle = await cycleRepository.get(uid, cycleId);
  if (!cycle) return null;
  const plan = await planRepository.get(uid, cycle.planId);
  return plan ? { plan, cycle } : null;
};

/** Close the finished cycle and generate the next one, starting no earlier than today. */
/**
 * Cycle numbers used to go up on every restart; bring stored cycles in line
 * with the rule in `renumberCycles`. Cheap when nothing changes.
 */
export const repairCycleNumbers = async (uid: Id): Promise<void> => {
  const all = await cycleRepository.listAll(uid);
  const byPlan = new Map<Id, Cycle[]>();
  for (const c of all) byPlan.set(c.planId, [...(byPlan.get(c.planId) ?? []), c]);
  for (const cycles of byPlan.values()) {
    for (const fixed of renumberCycles(cycles)) await cycleRepository.save(uid, fixed);
  }
};

/** The owner opened the report: the next cycle may start. Stamped once. */
export const markCycleReportReviewed = async (uid: Id, cycle: Cycle): Promise<Cycle> => {
  if (cycle.reportReviewedAt) return cycle;
  const updated = { ...cycle, reportReviewedAt: Date.now() };
  await cycleRepository.save(uid, updated);
  // A reviewed cycle counts towards the cycle badges.
  if (features.achievements) judgeAchievements(uid, null, { cycleId: cycle.id }).catch(err => console.warn('achievement judging failed', err));
  return updated;
};

/** The "report is ready" modal was shown; it won't show again for this cycle. */
export const markCycleReportPrompted = async (uid: Id, cycle: Cycle): Promise<Cycle> => {
  if (cycle.reportPromptedAt) return cycle;
  const updated = { ...cycle, reportPromptedAt: Date.now() };
  await cycleRepository.save(uid, updated);
  return updated;
};

export const startNextCycle = async (uid: Id, plan: Plan, cycle: Cycle): Promise<Cycle> => {
  const { cycle: closed } = closeCycle(cycle);
  await cycleRepository.save(uid, closed);
  afterCycleFinished(uid, closed.id, closed.number, summarizeCycle(closed, [], []).completionRate).catch(err => console.warn('buddy activity failed', err));
  const next = generateCycle(plan, uid, nextCycleNumberAfter(closed), nextCycleStart(plan, closed, today()));
  await cycleRepository.save(uid, next);
  await userRepository.update(uid, { activeCycleId: next.id });
  return next;
};
