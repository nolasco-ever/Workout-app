import { Session } from '../../data/models';
import { searchCatalog } from '../../data/catalog/exerciseCatalog';
import { Workout } from '../../data/models';
import { addExerciseTo, fillFromWorkout, isQuickSession, newQuickSession, sessionDisplayName, pastExercisesLike, removeExerciseFrom, skipExercise, substituteExercise, unskipExercise, activeExercises } from '../../data/engine/sessionExtras';
import { progressExercise } from '../../data/engine/progression';
import { finishPrompt } from '../../screens/Tabs/Workout/components/finishPrompt';

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

  it('names a quick workout by its kind, and a plan workout by its own name', () => {
    expect(sessionDisplayName(newQuickSession('u', '2026-10-03', makeId, 42, 'cardio'))).toBe('Quick cardio workout');
    expect(sessionDisplayName(newQuickSession('u', '2026-10-03', makeId, 42, 'stretching'))).toBe('Quick stretch workout');
    expect(sessionDisplayName(newQuickSession('u', '2026-10-03', makeId, 42))).toBe('Quick workout');
    expect(sessionDisplayName({ planId: 'p', cycleId: 'c', workoutName: 'Lower' })).toBe('Lower');
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

describe('past exercises like one being swapped', () => {
  const lift = (q: string) => searchCatalog({ query: q }).find(e => e.measurement === 'weight_reps' && e.primaryMuscles.includes('chest'))!;
  const bench = lift('barbell bench press');
  const incline = lift('incline dumbbell press');
  const fly = lift('cable fly');
  const sets = (n: number, done = true) => Array.from({ length: n }, (_, i) => ({ id: `s${i}`, setNumber: i + 1, weightKg: 40, reps: 10, durationSec: null, distanceM: null, completed: done, completedAt: done ? 5 : null }));
  const logged = (id: string, startedAt: number, date: string, ex: { exerciseId: string; sets: ReturnType<typeof sets> }[]): Session => ({
    ...base, id, status: 'completed', startedAt, finishedAt: startedAt + 1, date,
    exercises: ex.map((e, i) => ({ id: `${id}-${i}`, workoutExerciseId: null, exerciseId: e.exerciseId, exerciseName: e.exerciseId, measurement: 'weight_reps' as const, order: i, notes: null, target: { sets: 3, reps: 10, weightKg: 40, durationSec: null, distanceM: null }, sets: e.sets })),
  });

  it('lists what was done before for the same muscle, newest first, with the last sets', () => {
    const history = [
      logged('a', 1, '2026-09-01', [{ exerciseId: incline.id, sets: sets(3) }]),
      logged('b', 2, '2026-09-08', [{ exerciseId: fly.id, sets: sets(2) }, { exerciseId: incline.id, sets: sets(4) }]),
    ];
    const past = pastExercisesLike(bench, history);
    expect(past.map(p => p.exercise.id)).toEqual([fly.id, incline.id]);
    expect(past[1].lastSets).toHaveLength(4);
    expect(past[1].date).toBe('2026-09-08');
  });

  it('skips the exercise itself, what is already in the workout, and logs with nothing completed', () => {
    const history = [logged('a', 1, '2026-09-01', [{ exerciseId: bench.id, sets: sets(3) }, { exerciseId: incline.id, sets: sets(3) }, { exerciseId: fly.id, sets: sets(3, false) }])];
    expect(pastExercisesLike(bench, history, new Set([incline.id]))).toEqual([]);
  });
});

describe('newQuickSession kind (v1 #10)', () => {
  it('keeps the kind picked first, and none when started without one', () => {
    let n = 0;
    const id = () => `id${n++}`;
    expect(newQuickSession('u', '2026-11-07', id, 1, 'cardio')).toMatchObject({ kind: 'cardio', workoutName: 'Quick workout', exercises: [] });
    expect('kind' in newQuickSession('u', '2026-11-07', id, 1)).toBe(false);
  });
});

describe('skipping an exercise mid-workout', () => {
  const logged: Session = {
    ...base,
    exercises: [
      { ...base.exercises[0], sets: [
        { id: 'w', setNumber: 1, weightKg: 30, reps: 9, durationSec: null, distanceM: null, completed: true, completedAt: 5, warmup: true },
        { id: 'a', setNumber: 1, weightKg: 65, reps: 6, durationSec: null, distanceM: null, completed: true, completedAt: 6 },
        { id: 'b', setNumber: 2, weightKg: 70, reps: 3, durationSec: null, distanceM: null, completed: false, completedAt: null },
      ] },
      { id: 'e2', workoutExerciseId: 'w2', exerciseId: 'row', exerciseName: 'Row', measurement: 'weight_reps', order: 1, notes: null, target: { sets: 3, reps: 10, weightKg: 50, durationSec: null, distanceM: null }, sets: [
        { id: 'r1', setNumber: 1, weightKg: 50, reps: 10, durationSec: null, distanceM: null, completed: true, completedAt: 7 },
      ] },
    ],
  };

  it('clears what was typed or logged, back to fresh sets from the target', () => {
    const next = skipExercise(logged, 'e1', 'kg', makeId);
    const ex = next.exercises[0];
    expect(ex.skipped).toBe(true);
    expect(ex.sets.every(s => !s.completed)).toBe(true);
    const working = ex.sets.filter(s => !s.warmup);
    expect(working).toHaveLength(3);
    expect(working.every(s => s.weightKg === 60 && s.reps === 8)).toBe(true);
    // It had warm-ups, so it gets fresh ones back.
    expect(ex.sets.some(s => s.warmup)).toBe(true);
    expect(next.exercises[1]).toBe(logged.exercises[1]);
  });

  it('unskips back into place, with nothing logged', () => {
    const back = unskipExercise(skipExercise(logged, 'e1', 'kg', makeId), 'e1');
    expect(back.exercises[0].skipped).toBe(false);
    expect(back.exercises[0].sets.every(s => !s.completed)).toBe(true);
    expect(activeExercises(back)).toHaveLength(2);
  });

  it('lets every exercise be skipped', () => {
    const all = skipExercise(skipExercise(logged, 'e1', 'kg', makeId), 'e2', 'kg', makeId);
    expect(activeExercises(all)).toHaveLength(0);
  });

  it('holds the target for next time rather than counting a miss', () => {
    const skipped = skipExercise(logged, 'e1', 'kg', makeId).exercises[0];
    const entry = { id: 'w1', exerciseId: 'bench', exerciseName: 'Bench Press', measurement: 'weight_reps' as const, order: 0, sets: 3, repRangeMin: 8, repRangeMax: 12, startingWeightKg: 60, restSec: 90, progression: { weightIncrementKg: 2.5, repIncrement: 1 } };
    const p = progressExercise(entry as never, [skipped], null, 'kg');
    expect(p.target.weightKg).toBe(60);
    expect(p.target.reps).toBe(8);
  });

  it('leaves a skipped exercise out of the finish warning', () => {
    const next = skipExercise(logged, 'e1', 'kg', makeId);
    const prompt = finishPrompt(next);
    // Only the row is left, and its one set is in: nothing stays unlogged.
    expect('title' in prompt && prompt.title).toBe('Finish workout?');
  });
});
