import { Exercise, Id, Plan, Session, SessionExercise, wantsWarmup, WeightUnit, WorkoutExercise } from '../models';
import { newEntry } from './planDefaults';
import { buildPlannedSets, buildWarmupSets, progressExercise } from './progression';

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

/** Take an exercise back out of the session, e.g. one added by mistake. The last exercise stays. */
export const removeExerciseFrom = (session: Session, sessionExerciseId: Id): Session =>
  session.exercises.length <= 1 ? session : { ...session, exercises: session.exercises.filter(e => e.id !== sessionExerciseId) };
