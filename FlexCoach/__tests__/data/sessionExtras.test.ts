import { Session } from '../../data/models';
import { searchCatalog } from '../../data/catalog/exerciseCatalog';
import { addExerciseTo, removeExerciseFrom } from '../../data/engine/sessionExtras';

let n = 0;
const makeId = () => `id-${++n}`;

const base: Session = {
  id: 'sess', ownerId: 'u', planId: null, cycleId: null, occurrenceId: null, workoutId: null, workoutName: 'Upper',
  date: '2026-10-03', startedAt: 10, finishedAt: null, status: 'in_progress', createdAt: 10, updatedAt: 10,
  exercises: [
    { id: 'e1', workoutExerciseId: 'w1', exerciseId: 'bench', exerciseName: 'Bench Press', measurement: 'weight_reps', order: 0, notes: null, target: { sets: 3, reps: 8, weightKg: 60, durationSec: null, distanceM: null }, sets: [] },
  ],
};

describe('adding exercises to a running session', () => {
  it('appends the pick with default sets and no plan link', () => {
    const pullUp = searchCatalog({ query: 'pull-up' }).find(e => e.measurement === 'reps') ?? searchCatalog({ query: 'pull' })[0];
    const { session, exercise } = addExerciseTo(base, pullUp, null, [], 'lb', makeId);
    expect(session.exercises).toHaveLength(2);
    expect(session.exercises[1]).toBe(exercise);
    expect(exercise.workoutExerciseId).toBeNull();
    expect(exercise.exerciseId).toBe(pullUp.id);
    expect(exercise.order).toBe(1);
    expect(exercise.sets.length).toBeGreaterThan(0);
    expect(exercise.sets.every(s => !s.completed)).toBe(true);
  });

  it('starts a lift from the user\'s last log of it', () => {
    const squat = searchCatalog({ query: 'barbell squat' }).find(e => e.measurement === 'weight_reps')!;
    const earlier: Session = {
      ...base, id: 'old', status: 'completed', startedAt: 1, finishedAt: 2,
      exercises: [{ id: 'x', workoutExerciseId: null, exerciseId: squat.id, exerciseName: squat.name, measurement: 'weight_reps', order: 0, notes: null, target: { sets: 3, reps: 5, weightKg: 100, durationSec: null, distanceM: null }, sets: [
        { id: 's1', setNumber: 1, weightKg: 100, reps: 5, durationSec: null, distanceM: null, completed: true, completedAt: 1 },
        { id: 's2', setNumber: 2, weightKg: 100, reps: 5, durationSec: null, distanceM: null, completed: true, completedAt: 1 },
        { id: 's3', setNumber: 3, weightKg: 100, reps: 5, durationSec: null, distanceM: null, completed: true, completedAt: 1 },
      ] }],
    };
    const { exercise } = addExerciseTo(base, squat, null, [earlier], 'kg', makeId);
    const working = exercise.sets.filter(s => !s.warmup);
    expect(working.length).toBe(3);
    expect(working[0].weightKg).toBeGreaterThanOrEqual(100);
    expect(exercise.sets.some(s => s.warmup)).toBe(true);
  });

  it('removes an exercise but never the last one', () => {
    const pullUp = searchCatalog({ query: 'pull' })[0];
    const { session, exercise } = addExerciseTo(base, pullUp, null, [], 'lb', makeId);
    expect(removeExerciseFrom(session, exercise.id).exercises.map(e => e.id)).toEqual(['e1']);
    expect(removeExerciseFrom(base, 'e1')).toBe(base);
  });
});
