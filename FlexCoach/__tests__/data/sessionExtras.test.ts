import { Session } from '../../data/models';
import { searchCatalog } from '../../data/catalog/exerciseCatalog';
import { Workout } from '../../data/models';
import { addExerciseTo, fillFromWorkout, isQuickSession, newQuickSession, removeExerciseFrom, substituteExercise } from '../../data/engine/sessionExtras';

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

  it('builds an empty quick workout outside any plan', () => {
    const quick = newQuickSession('u', '2026-10-03', makeId, 42);
    expect(quick.exercises).toEqual([]);
    expect(quick.planId).toBeNull();
    expect(quick.cycleId).toBeNull();
    expect(quick.occurrenceId).toBeNull();
    expect(quick.workoutName).toBe('Quick workout');
    expect(quick.status).toBe('in_progress');
    expect(isQuickSession(quick)).toBe(true);
    expect(isQuickSession({ planId: 'p', cycleId: 'c' })).toBe(false);
  });
});

describe('swapping an exercise mid-session', () => {
  const lift = (q: string) => searchCatalog({ query: q }).find(e => e.measurement === 'weight_reps')!;
  const logged = (exerciseId: string, name: string, weightKg: number, reps: number): Session => ({
    ...base, id: `old-${exerciseId}`, status: 'completed', startedAt: 1, finishedAt: 2,
    exercises: [{ id: 'x', workoutExerciseId: null, exerciseId, exerciseName: name, measurement: 'weight_reps', order: 0, notes: null, target: { sets: 3, reps, weightKg, durationSec: null, distanceM: null }, sets: [
      { id: 's1', setNumber: 1, weightKg, reps, durationSec: null, distanceM: null, completed: true, completedAt: 1 },
      { id: 's2', setNumber: 2, weightKg, reps, durationSec: null, distanceM: null, completed: true, completedAt: 1 },
      { id: 's3', setNumber: 3, weightKg, reps, durationSec: null, distanceM: null, completed: true, completedAt: 1 },
    ] }],
  });

  it('leaves the weight blank for a lift never done, keeping the set count', () => {
    const raise = lift('lateral raise');
    const session = substituteExercise(base, 'e1', raise, null, [], 'lb', makeId);
    const swapped = session.exercises[0];
    expect(swapped.exerciseId).toBe(raise.id);
    expect(swapped.substitutedFor).toEqual({ exerciseId: 'bench', exerciseName: 'Bench Press' });
    const working = swapped.sets.filter(s => !s.warmup);
    expect(working).toHaveLength(3);
    expect(working.every(s => s.weightKg === null)).toBe(true);
    expect(swapped.sets.some(s => s.warmup)).toBe(false);
  });

  it('starts from the user\'s last log of the replacement when there is one', () => {
    const raise = lift('lateral raise');
    const session = substituteExercise(base, 'e1', raise, null, [logged(raise.id, raise.name, 10, 12)], 'kg', makeId);
    const working = session.exercises[0].sets.filter(s => !s.warmup);
    expect(working.every(s => s.weightKg === 10)).toBe(true);
    expect(working.every(s => s.reps === 12)).toBe(true);
  });

  it('gives a cardio replacement one set, not the lift\'s three', () => {
    const bike = searchCatalog({ query: 'bike' }).find(e => e.measurement === 'distance_time') ?? searchCatalog({ query: 'treadmill' }).find(e => e.measurement === 'distance_time')!;
    const session = substituteExercise(base, 'e1', bike, null, [], 'lb', makeId);
    const swapped = session.exercises[0];
    expect(swapped.measurement).toBe('distance_time');
    expect(swapped.sets).toHaveLength(1);
    expect(swapped.sets[0].weightKg).toBeNull();
  });
});

describe('copying a plan workout into a quick workout', () => {
  const bench = searchCatalog({ query: 'bench press' }).find(e => e.measurement === 'weight_reps')!;
  const plank = searchCatalog({ query: 'plank' }).find(e => e.measurement === 'time')!;
  const workout: Workout = {
    id: 'w', name: 'Upper', order: 0,
    exercises: [
      { id: 'we2', exerciseId: plank.id, exerciseName: plank.name, measurement: 'time', order: 1, sets: 1, repRangeMin: null, repRangeMax: null, startingWeightKg: null, startingDurationSec: 45, startingDistanceM: null, restSec: 60, progression: { weightIncrementKg: 2.5, repStep: 1, durationStepSec: 10, distanceStepM: 0 }, notes: null },
      { id: 'we1', exerciseId: bench.id, exerciseName: bench.name, measurement: 'weight_reps', order: 0, sets: 3, repRangeMin: 8, repRangeMax: 12, startingWeightKg: null, startingDurationSec: null, startingDistanceM: null, restSec: 90, progression: { weightIncrementKg: 2.5, repStep: 1, durationStepSec: 0, distanceStepM: 0 }, notes: null },
    ],
  };

  it('takes the name and exercises in order, unlinked from the plan', () => {
    const quick = newQuickSession('u', '2026-10-05', makeId, 42);
    const filled = fillFromWorkout(quick, workout, () => null, [], 'lb', makeId);
    expect(filled.workoutName).toBe('Upper');
    expect(filled.planId).toBeNull();
    expect(filled.exercises.map(e => e.exerciseId)).toEqual([bench.id, plank.id]);
    expect(filled.exercises.every(e => e.workoutExerciseId === null)).toBe(true);
    expect(filled.exercises[0].sets.filter(s => !s.warmup)).toHaveLength(3);
    expect(filled.exercises[1].sets).toHaveLength(1);
    expect(filled.exercises[1].target.durationSec).toBe(45);
  });

  it('uses the cycle target when given, else the last log', () => {
    const quick = newQuickSession('u', '2026-10-05', makeId, 42);
    const earlier: Session = {
      ...base, id: 'old', status: 'completed', startedAt: 1, finishedAt: 2,
      exercises: [{ id: 'x', workoutExerciseId: null, exerciseId: bench.id, exerciseName: bench.name, measurement: 'weight_reps', order: 0, notes: null, target: { sets: 3, reps: 10, weightKg: 80, durationSec: null, distanceM: null }, sets: [
        { id: 's1', setNumber: 1, weightKg: 80, reps: 10, durationSec: null, distanceM: null, completed: true, completedAt: 1 },
      ] }],
    };
    const fromLog = fillFromWorkout(quick, workout, () => null, [earlier], 'kg', makeId);
    expect(fromLog.exercises[0].sets.filter(s => !s.warmup)[0].weightKg).toBe(80);
    const fromCycle = fillFromWorkout(quick, workout, entry => (entry.id === 'we1' ? { sets: 3, reps: 8, weightKg: 100, durationSec: null, distanceM: null } : null), [earlier], 'kg', makeId);
    expect(fromCycle.exercises[0].sets.filter(s => !s.warmup)[0].weightKg).toBe(100);
  });
});
