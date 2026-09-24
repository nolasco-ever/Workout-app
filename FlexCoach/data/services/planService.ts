import { Cycle, DEFAULT_PROGRESSION, Exercise, GOAL_DEFAULTS, Id, LocalDate, Plan, PlanGoal, Schedule, Workout, WorkoutExercise } from '../models';
import { newId } from '../engine/ids';
import { today } from '../engine/dates';
import { closeCycle, generateCycle } from '../engine/schedule';
import { planRepository } from '../repositories/planRepository';
import { cycleRepository } from '../repositories/cycleRepository';
import { userRepository } from '../repositories/userRepository';

/** A fresh, empty plan for the editor. */
export const newPlan = (ownerId: Id): Plan => {
  const now = Date.now();
  return {
    id: newId(),
    ownerId,
    name: '',
    description: null,
    status: 'draft',
    goal: 'hypertrophy',
    workouts: [],
    schedule: { mode: 'rotation', slots: [], passesPerCycle: 1 },
    sharedFrom: null,
    archivedAt: null,
    createdAt: now,
    updatedAt: now,
  };
};

export const newWorkout = (name: string, order: number): Workout => ({ id: newId(), name, order, exercises: [] });

/** Build an entry for a catalog exercise using the plan's goal defaults. */
export const newEntry = (exercise: Exercise, order: number, goal: PlanGoal | null): WorkoutExercise => {
  const d = GOAL_DEFAULTS[goal ?? 'hypertrophy'];
  const timed = exercise.measurement === 'time';
  const cardio = exercise.measurement === 'distance_time';
  return {
    id: newId(),
    exerciseId: exercise.id,
    exerciseName: exercise.name,
    measurement: exercise.measurement,
    order,
    sets: cardio ? 1 : d.sets,
    repRangeMin: timed || cardio ? null : d.repRangeMin,
    repRangeMax: timed || cardio ? null : d.repRangeMax,
    startingWeightKg: null,
    startingDurationSec: timed ? 30 : cardio ? 1200 : null,
    startingDistanceM: cardio ? 3000 : null,
    restSec: d.restSec,
    progression: { ...DEFAULT_PROGRESSION },
    notes: null,
  };
};

export interface PlanProblem {
  field: 'name' | 'workouts' | 'schedule';
  message: string;
}

export const validatePlan = (plan: Plan): PlanProblem[] => {
  const problems: PlanProblem[] = [];
  if (!plan.name.trim()) problems.push({ field: 'name', message: 'Give the plan a name.' });
  if (plan.workouts.length === 0) problems.push({ field: 'workouts', message: 'Add at least one workout.' });
  const empty = plan.workouts.filter(w => w.exercises.length === 0);
  if (empty.length) problems.push({ field: 'workouts', message: `${empty.map(w => w.name || 'Untitled').join(', ')} ${empty.length === 1 ? 'has' : 'have'} no exercises.` });
  const ids = new Set(plan.workouts.map(w => w.id));
  const scheduled =
    plan.schedule.mode === 'rotation' ? plan.schedule.slots.filter(s => s && ids.has(s)) : plan.schedule.weekdays.filter(s => s && ids.has(s));
  if (scheduled.length === 0) problems.push({ field: 'schedule', message: 'Put at least one workout on the schedule.' });
  return problems;
};

/** Drop schedule references to workouts that no longer exist. */
export const pruneSchedule = (plan: Plan): Plan => {
  const ids = new Set(plan.workouts.map(w => w.id));
  const keep = (id: Id | null) => (id && ids.has(id) ? id : null);
  const schedule: Schedule =
    plan.schedule.mode === 'rotation'
      ? { ...plan.schedule, slots: plan.schedule.slots.map(keep) }
      : { ...plan.schedule, weekdays: plan.schedule.weekdays.map(keep) as typeof plan.schedule.weekdays };
  return { ...plan, schedule };
};

/**
 * True when an edit to an active plan changes what the cycle is made of:
 * the schedule itself, or which workouts exist. Exercise edits inside a
 * workout don't count; sessions snapshot targets when they start.
 */
export const cycleNeedsRestart = (before: Plan, after: Plan): boolean => {
  const ids = (p: Plan) => p.workouts.map(w => w.id).sort().join('|');
  return JSON.stringify(before.schedule) !== JSON.stringify(after.schedule) || ids(before) !== ids(after);
};

export const savePlan = (uid: Id, plan: Plan): Promise<void> => planRepository.save(uid, pruneSchedule(plan));

/** Save an edited active plan and, if needed, restart its cycle from today. */
export const saveActivePlan = async (uid: Id, before: Plan, after: Plan, activeCycle: Cycle | null): Promise<{ restarted: boolean }> => {
  const pruned = pruneSchedule(after);
  await planRepository.save(uid, pruned);
  if (!activeCycle || !cycleNeedsRestart(before, pruned)) return { restarted: false };
  const { cycle: closed } = closeCycle(activeCycle);
  await cycleRepository.save(uid, closed);
  const next = generateCycle(pruned, uid, activeCycle.number + 1, today());
  await cycleRepository.save(uid, next);
  await userRepository.update(uid, { activeCycleId: next.id });
  return { restarted: true };
};

/**
 * Generate a fresh cycle for a plan, closing any of its cycles still open.
 * Also the repair path when a profile points at a plan with no live cycle.
 * `startDate` is the earliest day the cycle may begin; today by default.
 */
export const startFreshCycle = async (uid: Id, plan: Plan, startDate: LocalDate = today()): Promise<Cycle> => {
  const previous = await cycleRepository.listForPlan(uid, plan.id);
  const number = previous.length ? Math.max(...previous.map(c => c.number)) + 1 : 1;
  for (const c of previous.filter(c => c.status === 'active')) {
    await cycleRepository.save(uid, closeCycle(c).cycle);
  }
  const cycle = generateCycle(plan, uid, number, startDate);
  await cycleRepository.save(uid, cycle);
  await userRepository.update(uid, { activePlanId: plan.id, activeCycleId: cycle.id });
  return cycle;
};

/** Activate a plan with its first cycle starting no earlier than `startDate` (today by default). */
export const activatePlan = async (uid: Id, plan: Plan, startDate: LocalDate = today()): Promise<Cycle> => {
  const pruned = pruneSchedule(plan);
  await planRepository.save(uid, pruned);
  // Cycle first, then the status flip, so a failure never leaves an active
  // plan without a cycle.
  const cycle = await startFreshCycle(uid, pruned, startDate);
  await planRepository.activate(uid, plan.id);
  return cycle;
};

export const deactivatePlan = async (uid: Id, plan: Plan, activeCycle: Cycle | null): Promise<void> => {
  if (activeCycle) await cycleRepository.save(uid, closeCycle(activeCycle).cycle);
  await planRepository.save(uid, { ...plan, status: 'draft' });
  await userRepository.update(uid, { activePlanId: null, activeCycleId: null });
};

export const archivePlan = async (uid: Id, plan: Plan, activeCycle: Cycle | null): Promise<void> => {
  if (plan.status === 'active') await deactivatePlan(uid, plan, activeCycle);
  await planRepository.archive(uid, plan.id);
};

export const duplicatePlan = async (uid: Id, source: Plan): Promise<Plan> => {
  const copy = await planRepository.copyTo(uid, { ...source, name: `${source.name} copy` }, uid, newId);
  return { ...copy, sharedFrom: null };
};
