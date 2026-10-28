import { applySwap, swapReach, swappableExercises, undoSwap } from '../../data/engine/legacySwap';
import { canonicalExerciseId } from '../../data/catalog/exerciseIds';
import { getCatalogExercise, catalogName, LEGACY_PICK } from '../../data/catalog/exerciseCatalog';
import { Plan, Session } from '../../data/models';
import { entry, lastSession, rotationPlan, set } from './support/fixtures';

const legPress = entry({ exerciseId: 'Leg_Press', exerciseName: 'Leg Press' });
const bench = entry({ exerciseId: 'Barbell_Bench_Press_-_Medium_Grip', exerciseName: 'Bench Press' });
const session = (id: string, startedAt: number, weights: number[]): Session => ({
  id, ownerId: 'u', planId: 'plan-1', cycleId: null, occurrenceId: null, workoutId: 'legs', workoutName: 'Legs', date: '2026-10-01',
  startedAt, finishedAt: startedAt + 1, status: 'completed', createdAt: 0, updatedAt: 0,
  exercises: [lastSession({}, weights.map(w => set({ weightKg: w })), legPress), lastSession({}, [set()], bench)],
});
const history = [session('a', 1, [100]), session('b', 2, [110]), session('c', 3, [120])];
const plan = (): Plan => {
  const p = rotationPlan();
  p.workouts[2].exercises = [{ ...legPress, id: 'entry-leg' }];
  return p;
};
const key = canonicalExerciseId('Leg_Press');
const to = getCatalogExercise(`${LEGACY_PICK}Leg_Press`)!;

describe('legacy swap', () => {
  it('lists every exercise with logged sets, most logged first, by what the app calls it now', () => {
    const p = plan();
    p.workouts[0].exercises = [entry({ exerciseId: 'Dumbbell_Flyes', exerciseName: 'Dumbbell Flyes' })];
    const list = swappableExercises(history, p, catalogName);
    expect(list.map(e => [e.name, e.workouts, e.inActivePlan])).toEqual([
      ['45-Degree Sled Leg Press', 3, true],
      ['Barbell Bench Press', 3, false],
    ]);
    expect(list[0].storedIds).toEqual(['Leg_Press']);
  });

  it('counts the workouts and records that carry over', () => {
    expect(swapReach(history, key)).toEqual({ workouts: 3, records: 2 });
  });

  it('moves the history, and the active plan only when asked', () => {
    const kept = applySwap({ history, key, from: { id: 'Leg_Press', name: 'x' }, to, activePlan: plan(), replaceInPlan: false, id: 'sw', now: 9 });
    expect(kept.plan).toBeNull();
    expect(kept.swap.plan).toBeNull();
    const done = applySwap({ history, key, from: { id: 'Leg_Press', name: 'x' }, to, activePlan: plan(), replaceInPlan: true, id: 'sw', now: 9 });
    expect(done.sessions).toHaveLength(3);
    expect(done.sessions.every(s => s.exercises[0].exerciseId === to.id && s.exercises[0].exerciseName === 'Leg Press')).toBe(true);
    expect(done.sessions.every(s => s.exercises[1].exerciseId === bench.exerciseId)).toBe(true);
    expect(done.plan?.workouts[2].exercises[0]).toMatchObject({ exerciseId: to.id, sets: 3, restSec: 90 });
    // The records follow: the new exercise has them now.
    expect(swapReach(done.sessions, canonicalExerciseId(to.id))).toEqual({ workouts: 3, records: 2 });
  });

  it('undoes it, leaving alone what changed again since', () => {
    const done = applySwap({ history, key, from: { id: 'Leg_Press', name: 'x' }, to, activePlan: plan(), replaceInPlan: true, id: 'sw', now: 9 });
    const movedOn = done.sessions.map((s, i) => (i === 0 ? { ...s, exercises: s.exercises.map((ex, j) => (j === 0 ? { ...ex, exerciseId: 'Other' } : ex)) } : s));
    const undone = undoSwap(done.swap, movedOn, [done.plan!]);
    expect(undone.sessions.map(s => s.id)).toEqual(['b', 'c']);
    expect(undone.sessions.every(s => s.exercises[0].exerciseId === 'Leg_Press')).toBe(true);
    expect(undone.plan?.workouts[2].exercises[0].exerciseId).toBe('Leg_Press');
  });
});
