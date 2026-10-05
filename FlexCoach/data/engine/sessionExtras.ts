import { Exercise, Id, Plan, Session, SessionExercise, SetTarget, wantsWarmup, WeightUnit, Workout, WorkoutExercise } from '../models';
import { newEntry } from './planDefaults';
import { buildPlannedSets, buildWarmupSets, progressExercise } from './progression';
import { findWorkout } from './schedule';

/** Exercises added to a running session on the spot, outside the plan. */

/** The most recent completed log of an exercise before `session`, for a starting target. */
const lastLogOf = (exerciseId: Id, history: Session[], session: Session): SessionExercise | null => {
  const completed = history.filter(s => s.status === 'completed' && s.id !== session.id).sort((a, b) => a.startedAt - b.startedAt);
  for (let i = completed.length - 1; i >= 0; i--) {
    const found = completed[i].exercises.find(e => e.exerciseId === exerciseId);
    if (found) return found;
  }
  return null;
};

/**
 * Add an exercise to the running session only; the plan is untouched. It
 * goes on the end, with its target from the user's last log of it when
 * there is one, else the plan-editor defaults for its kind (and the plan's
 * goal when the session came from a plan), with warm-ups if it wants them.
 */
export const addExerciseTo = (session: Session, exercise: Exercise, plan: Plan | null, history: Session[], unit: WeightUnit, makeId: () => Id): { session: Session; exercise: SessionExercise } => {
  const order = session.exercises.reduce((n, e) => Math.max(n, e.order), -1) + 1;
  const entry: WorkoutExercise = { ...newEntry(exercise, order, plan?.goal ?? null, unit), id: makeId() };
  const target = progressExercise(entry, [], lastLogOf(exercise.id, history, session), unit).target;
  const warmups = wantsWarmup(entry) ? buildWarmupSets(target, unit, makeId) : [];
  const added: SessionExercise = {
    id: makeId(),
    workoutExerciseId: null,
    exerciseId: exercise.id,
    exerciseName: exercise.name,
    measurement: exercise.measurement,
    order,
    target,
    sets: [...warmups, ...buildPlannedSets(target, makeId)],
    notes: null,
  };
  return { session: { ...session, exercises: [...session.exercises, added] }, exercise: added };
};

/**
 * Replace an exercise for the rest of this session only; the plan is
 * untouched. Sets logged for the old one are dropped. The replacement
 * starts from the user's last log of it when there is one. Without one it
 * starts like a freshly added exercise: the old exercise's weight is no
 * guide to a lift never done, so weight stays blank and only the plan
 * entry's sets, rep range and rest carry over (when both are measured the
 * same way).
 */
export const substituteExercise = (session: Session, sessionExerciseId: Id, replacement: Exercise, plan: Plan | null, history: Session[], unit: WeightUnit, makeId: () => Id): Session => {
  const ex = session.exercises.find(e => e.id === sessionExerciseId);
  if (!ex) throw new Error('Unknown session exercise');
  const planEntry = plan ? findWorkout(plan, session.workoutId)?.exercises.find(e => e.id === ex.workoutExerciseId) : undefined;
  const fresh = newEntry(replacement, ex.order, plan?.goal ?? null, unit);
  const sameKind = replacement.measurement === ex.measurement;
  const entry: WorkoutExercise = {
    ...fresh,
    id: ex.workoutExerciseId ?? makeId(),
    restSec: planEntry?.restSec ?? fresh.restSec,
    progression: planEntry?.progression ?? fresh.progression,
    ...(sameKind && planEntry ? { sets: planEntry.sets, repRangeMin: planEntry.repRangeMin, repRangeMax: planEntry.repRangeMax } : {}),
    ...(sameKind && !planEntry ? { sets: ex.target.sets, repRangeMax: ex.target.reps } : {}),
  };
  const target = progressExercise(entry, [], lastLogOf(replacement.id, history, session), unit).target;
  const warmups = wantsWarmup(entry) ? buildWarmupSets(target, unit, makeId) : [];
  const swapped: SessionExercise = {
    ...ex,
    exerciseId: replacement.id,
    exerciseName: replacement.name,
    measurement: replacement.measurement,
    target,
    sets: [...warmups, ...buildPlannedSets(target, makeId)],
    substitutedFor: ex.substitutedFor ?? { exerciseId: ex.exerciseId, exerciseName: ex.exerciseName },
  };
  return { ...session, exercises: session.exercises.map(e => (e.id === ex.id ? swapped : e)) };
};

/**
 * The session exercises for a plan workout, in order, each with its target
 * and the empty sets to log. `targetFor` is the cycle's fixed target for an
 * entry, or null to start it from the user's last log (or from scratch).
 * `linked` ties each one to its plan entry; a copy into a quick workout
 * leaves them free-standing, since no cycle will judge them.
 */
export const buildWorkoutExercises = (
  workout: Workout,
  targetFor: (entry: WorkoutExercise) => SetTarget | null,
  history: Session[],
  session: Pick<Session, 'id'>,
  unit: WeightUnit,
  makeId: () => Id,
  linked: boolean,
): SessionExercise[] =>
  [...workout.exercises]
    .sort((a, b) => a.order - b.order)
    .map((entry, i) => {
      const target = targetFor(entry) ?? progressExercise(entry, [], lastLogOf(entry.exerciseId, history, session as Session), unit).target;
      const warmups = wantsWarmup(entry) ? buildWarmupSets(target, unit, makeId) : [];
      return {
        id: makeId(),
        workoutExerciseId: linked ? entry.id : null,
        exerciseId: entry.exerciseId,
        exerciseName: entry.exerciseName,
        measurement: entry.measurement,
        order: i,
        target,
        sets: [...warmups, ...buildPlannedSets(target, makeId)],
        notes: null,
      };
    });

/**
 * Fill an empty quick workout with a copy of one of the plan's workouts.
 * It takes the workout's name and exercises but stays outside the plan: no
 * cycle, no occurrence, and nothing it logs moves the plan's targets.
 */
export const fillFromWorkout = (session: Session, workout: Workout, targetFor: (entry: WorkoutExercise) => SetTarget | null, history: Session[], unit: WeightUnit, makeId: () => Id): Session => ({
  ...session,
  workoutName: workout.name,
  exercises: buildWorkoutExercises(workout, targetFor, history, session, unit, makeId, false),
});

/** Take an exercise back out of the session, e.g. one added by mistake. The last exercise stays. */
export const removeExerciseFrom = (session: Session, sessionExerciseId: Id): Session =>
  session.exercises.length <= 1 ? session : { ...session, exercises: session.exercises.filter(e => e.id !== sessionExerciseId) };

/**
 * A workout with no plan behind it: nothing planned today, but something
 * is going in. Starts empty; the session screen opens the picker at once.
 * Counts like any other session (history, streak, records, buddies).
 */
export const newQuickSession = (uid: Id, date: string, makeId: () => Id, now: number = Date.now()): Session => ({
  id: makeId(),
  ownerId: uid,
  planId: null,
  cycleId: null,
  occurrenceId: null,
  workoutId: null,
  workoutName: 'Quick workout',
  date,
  startedAt: now,
  finishedAt: null,
  status: 'in_progress',
  exercises: [],
  createdAt: now,
  updatedAt: now,
});

/** A session that stands on its own, outside any plan. */
export const isQuickSession = (session: Pick<Session, 'planId' | 'cycleId'>): boolean => session.planId === null && session.cycleId === null;
