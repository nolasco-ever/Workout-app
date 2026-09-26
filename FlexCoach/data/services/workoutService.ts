import {
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
  SessionExercise,
  UserProfile,
  WeightUnit,
  wantsWarmup,
} from '../models';
import { addDays, today } from '../engine/dates';
import { newId } from '../engine/ids';
import {
  closeCycle,
  findWorkout,
  generateCycle,
  markOccurrence,
  moveOccurrenceToDate,
  pushOccurrence,
  skipOccurrence,
} from '../engine/schedule';
import { buildPlannedSets, buildWarmupSets, suggestTarget } from '../engine/progression';
import { countWorkingSets, currentStreakDays, findPersonalRecords, summarizeCycle, totalVolumeKg } from '../engine/stats';
import { cycleRepository } from '../repositories/cycleRepository';
import { planRepository } from '../repositories/planRepository';
import { sessionRepository } from '../repositories/sessionRepository';
import { userRepository } from '../repositories/userRepository';
import { achievementRepository } from '../repositories/achievementRepository';
import { buildSamplePlan } from './samplePlan';
import { activatePlan } from './planService';

/**
 * Use-case layer for the Workout tab. Screens call these; they compose the
 * pure engines with the repositories and keep the profile's active ids in
 * step. Nothing here holds state.
 */

const laterOf = (a: LocalDate, b: LocalDate): LocalDate => (a > b ? a : b);

/** Development helper: write and activate the sample plan for this user. */
export const seedSamplePlan = async (uid: Id): Promise<{ plan: Plan; cycle: Cycle }> => {
  const plan = buildSamplePlan(uid);
  const cycle = await activatePlan(uid, plan);
  return { plan, cycle };
};

export const skipWorkout = async (uid: Id, cycle: Cycle, occurrenceId: Id): Promise<Cycle> => {
  const updated = skipOccurrence(cycle, occurrenceId);
  await cycleRepository.save(uid, updated);
  return updated;
};

/**
 * Push a missed workout forward until it lands on `targetDate` (normally
 * today). Each step cascades through the engine, so anything in the way
 * moves too. Stops early if the workout gets pushed out of a weekly cycle.
 */
export const pushWorkoutTo = async (uid: Id, plan: Plan, cycle: Cycle, occurrenceId: Id, targetDate: LocalDate): Promise<Cycle> => {
  let updated = cycle;
  for (let guard = 0; guard < 60; guard++) {
    const occ = updated.occurrences.find(o => o.id === occurrenceId);
    if (!occ || occ.status !== 'scheduled' || occ.date >= targetDate) break;
    updated = pushOccurrence(updated, plan, occurrenceId);
  }
  await cycleRepository.save(uid, updated);
  return updated;
};

const latestExerciseLog = (history: Session[], exerciseId: Id): SessionExercise | null => {
  for (let i = history.length - 1; i >= 0; i--) {
    const found = history[i].exercises.find(ex => ex.exerciseId === exerciseId);
    if (found) return found;
  }
  return null;
};

/**
 * Start a session for an occurrence. `unit` only affects how warm-up weights
 * are rounded (to 5 lb or 2.5 kg); everything is stored in kilograms.
 */
export const startSession = async (uid: Id, plan: Plan, cycle: Cycle, occurrence: Occurrence, unit: WeightUnit = 'lb'): Promise<{ session: Session; cycle: Cycle }> => {
  const workout = findWorkout(plan, occurrence.workoutId);
  if (!workout) throw new Error('Occurrence has no workout');
  const history = await sessionRepository.listCompleted(uid);
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
    exercises: [...workout.exercises]
      .sort((a, b) => a.order - b.order)
      .map((entry, i) => {
        const target = suggestTarget(entry, latestExerciseLog(history, entry.exerciseId));
        const warmups = wantsWarmup(entry) ? buildWarmupSets(target, unit, newId) : [];
        return {
          id: newId(),
          workoutExerciseId: entry.id,
          exerciseId: entry.exerciseId,
          exerciseName: entry.exerciseName,
          measurement: entry.measurement,
          order: i,
          target,
          sets: [...warmups, ...buildPlannedSets(target, newId)],
          notes: null,
        };
      }),
    createdAt: now,
    updatedAt: now,
  };
  await sessionRepository.save(uid, session);
  const updatedCycle = markOccurrence(cycle, occurrence.id, 'in_progress', session.id);
  await cycleRepository.save(uid, updatedCycle);
  return { session, cycle: updatedCycle };
};

/**
 * Start a workout regardless of the day it was scheduled for. A future
 * workout swaps places with today's slot; a missed one is pushed forward to
 * today, cascading anything in its way. Today's workout just starts.
 */
export const startWorkoutNow = async (uid: Id, plan: Plan, cycle: Cycle, occurrence: Occurrence, unit: WeightUnit = 'lb'): Promise<{ session: Session; cycle: Cycle }> => {
  const todayDate = today();
  let current = cycle;
  if (occurrence.date > todayDate) {
    current = moveOccurrenceToDate(cycle, occurrence.id, todayDate);
    await cycleRepository.save(uid, current);
  } else if (occurrence.date < todayDate) {
    current = await pushWorkoutTo(uid, plan, cycle, occurrence.id, todayDate);
  }
  const moved = current.occurrences.find(o => o.id === occurrence.id);
  if (!moved || moved.status !== 'scheduled') throw new Error('Workout could not be scheduled for today');
  return startSession(uid, plan, current, moved, unit);
};

export const logSet = (uid: Id, session: Session, sessionExerciseId: Id, set: LoggedSet): Promise<Session> =>
  sessionRepository.logSet(uid, session, sessionExerciseId, set);

export interface SessionResult {
  session: Session;
  cycle: Cycle;
  durationSec: number;
  volumeKg: number;
  setsCompleted: number;
  personalRecords: PersonalRecord[];
}

const refreshPublicProfile = async (uid: Id, profile: UserProfile | null, completed: Session[], lastCycleRate: number | null): Promise<void> => {
  const todayDate = today();
  const unlocks = await achievementRepository.list(uid);
  const dates = completed.map(s => s.date);
  const pub: PublicProfile = {
    id: uid,
    displayName: profile?.displayName ?? null,
    photoUrl: profile?.photoUrl ?? null,
    currentStreakDays: currentStreakDays(completed, todayDate, addDays),
    longestStreakDays: Math.max(currentStreakDays(completed, todayDate, addDays), 0),
    totalSessions: completed.length,
    lastWorkoutDate: dates.length ? dates.sort()[dates.length - 1] : null,
    lastCycleCompletionRate: lastCycleRate,
    skippedLastScheduled: false,
    achievementIds: unlocks.map(u => u.achievementId),
    updatedAt: Date.now(),
  };
  await userRepository.writePublicProfile(pub);
};

export const finishSession = async (uid: Id, profile: UserProfile | null, session: Session, cycle: Cycle): Promise<SessionResult> => {
  const finished = await sessionRepository.finish(uid, session, 'completed');
  const updatedCycle = session.occurrenceId ? markOccurrence(cycle, session.occurrenceId, 'completed', session.id) : cycle;
  if (updatedCycle !== cycle) await cycleRepository.save(uid, updatedCycle);

  const completed = await sessionRepository.listCompleted(uid);
  const history = completed.filter(s => s.id !== session.id);
  const personalRecords = findPersonalRecords([finished], history);
  refreshPublicProfile(uid, profile, completed, null).catch(err => console.warn('public profile refresh failed', err));

  return {
    session: finished,
    cycle: updatedCycle,
    durationSec: Math.round(((finished.finishedAt ?? Date.now()) - finished.startedAt) / 1000),
    volumeKg: totalVolumeKg([finished]),
    setsCompleted: countWorkingSets([finished]),
    personalRecords,
  };
};

export const abandonSession = async (uid: Id, session: Session, cycle: Cycle): Promise<Cycle> => {
  await sessionRepository.finish(uid, session, 'abandoned');
  if (!session.occurrenceId) return cycle;
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
}

export const getCycleReview = async (uid: Id, cycle: Cycle): Promise<CycleReview> => {
  const all = await sessionRepository.listCompleted(uid);
  const inCycle = all.filter(s => s.cycleId === cycle.id);
  const before = all.filter(s => s.cycleId !== cycle.id && s.date < cycle.startDate);
  return {
    summary: summarizeCycle(cycle, inCycle, before),
    sessions: inCycle,
    volumeKg: totalVolumeKg(inCycle),
    durationSec: inCycle.reduce((n, s) => n + Math.max(0, Math.round(((s.finishedAt ?? s.startedAt) - s.startedAt) / 1000)), 0),
    setsCompleted: countWorkingSets(inCycle),
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
export const startNextCycle = async (uid: Id, plan: Plan, cycle: Cycle): Promise<Cycle> => {
  const { cycle: closed, nextStart } = closeCycle(cycle);
  await cycleRepository.save(uid, closed);
  const next = generateCycle(plan, uid, cycle.number + 1, laterOf(nextStart, today()));
  await cycleRepository.save(uid, next);
  await userRepository.update(uid, { activeCycleId: next.id });
  return next;
};
