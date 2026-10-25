import { Session, SessionExercise, LoggedSet } from '../../data/models/session';
import { buildLiveActivityState, describeFinish, describeTarget, nextOpenSet } from '../../screens/Tabs/Workout/components/liveActivityState';

const set = (id: string, n: number, completed = false, extra: Partial<LoggedSet> = {}): LoggedSet => ({ id, setNumber: n, weightKg: null, reps: null, durationSec: null, distanceM: null, completed, completedAt: completed ? 1 : null, ...extra });
const exercise = (id: string, name: string, sets: LoggedSet[], extra: Partial<SessionExercise> = {}): SessionExercise => ({
  id,
  workoutExerciseId: null,
  exerciseId: `cat-${id}`,
  exerciseName: name,
  measurement: 'weight_reps',
  order: 0,
  target: { sets: sets.length, reps: 8, weightKg: 100, durationSec: null, distanceM: null },
  sets,
  notes: null,
  ...extra,
});
const session = (exercises: SessionExercise[]): Session => ({ id: 's1', createdAt: 0, updatedAt: 0, ownerId: 'u', planId: null, cycleId: null, occurrenceId: null, workoutId: null, workoutName: 'Push', date: '2026-10-17', startedAt: 1000, finishedAt: null, status: 'in_progress', exercises });
const units = { weight: 'kg' as const, distance: 'km' as const };

describe('nextOpenSet', () => {
  it('takes the first open set of the exercise on screen', () => {
    const s = session([exercise('a', 'Bench', [set('a1', 1, true), set('a2', 2)]), exercise('b', 'Row', [set('b1', 1)])]);
    expect(nextOpenSet(s, 0)?.set.id).toBe('a2');
  });
  it('moves on to the next exercise when the shown one is done, then wraps round', () => {
    const s = session([exercise('a', 'Bench', [set('a1', 1)]), exercise('b', 'Row', [set('b1', 1, true)])]);
    expect(nextOpenSet(s, 1)?.set.id).toBe('a1');
    expect(nextOpenSet(session([exercise('a', 'Bench', [set('a1', 1, true)])]), 0)).toBeNull();
  });
});

describe('describeTarget', () => {
  it('uses the plan target in the lifter\'s unit', () => {
    const ex = exercise('a', 'Bench', [set('a1', 1)]);
    expect(describeTarget(ex, ex.sets[0], undefined, units)).toBe('100 kg × 8');
    expect(describeTarget(ex, ex.sets[0], undefined, { weight: 'lb', distance: 'mi' })).toMatch(/^220\.\d+ lb × 8$|^220 lb × 8$/);
  });
  it('prefers what was typed, and the per-set goal over the headline', () => {
    const ex = exercise('a', 'Bench', [set('a1', 1), set('a2', 2)], { target: { sets: 2, reps: 8, weightKg: 100, durationSec: null, distanceM: null, perSet: [{ weightKg: 100, reps: 8 }, { weightKg: 105, reps: 6 }] } });
    expect(describeTarget(ex, ex.sets[1], undefined, units)).toBe('105 kg × 6');
    expect(describeTarget(ex, ex.sets[1], { a: '110', b: '5' }, units)).toBe('110 kg × 5');
  });
  it('with no plan target, the last logged set is the target', () => {
    const ex = exercise('a', 'Bench', [set('a1', 1, true, { weightKg: 80, reps: 10 }), set('a2', 2)], { target: { sets: 2, reps: null, weightKg: null, durationSec: null, distanceM: null } });
    expect(describeTarget(ex, ex.sets[1], undefined, units)).toBe('80 kg × 10');
    expect(describeTarget(ex, ex.sets[0], undefined, units)).toBe('80 kg × 10');
  });
  it('shows reps alone for bodyweight and the time for a timed effort', () => {
    const reps = exercise('a', 'Pull-up', [set('a1', 1)], { measurement: 'reps', target: { sets: 1, reps: 10, weightKg: null, durationSec: null, distanceM: null } });
    expect(describeTarget(reps, reps.sets[0], undefined, units)).toBe('10 reps');
    expect(describeTarget(reps, reps.sets[0], { a: '10', b: '8' }, units)).toBe('8 reps · +10 kg');
    const plank = exercise('p', 'Plank', [set('p1', 1)], { measurement: 'time', target: { sets: 1, reps: null, weightKg: null, durationSec: 90, distanceM: null } });
    expect(describeTarget(plank, plank.sets[0], undefined, units)).toBe('1:30');
  });
});

describe('buildLiveActivityState', () => {
  const s = session([exercise('a', 'Bench', [set('a1', 1, true), set('a2', 2)])]);
  const base = { session: s, index: 0, drafts: {}, units, restStartedAt: null, restFor: 90, restSec: 120, clock: null };
  it('lists the exercises for the Watch, pointing at the one the next set belongs to', () => {
    const three = session([exercise('a', 'Bench', [set('a1', 1, true)]), exercise('b', 'Row', [set('b1', 1)]), exercise('c', 'Curl', [set('c1', 1)])]);
    const state = buildLiveActivityState({ ...base, session: three, index: 0 });
    expect(state.exercises).toEqual([{ id: 'a', name: 'Bench', done: true }, { id: 'b', name: 'Row', done: false }, { id: 'c', name: 'Curl', done: false }]);
    expect(state.exerciseIndex).toBe(1);
    expect(buildLiveActivityState({ ...base, session: three, index: 2 }).exerciseIndex).toBe(2);
  });
  it('between sets: the next target with its check', () => {
    const state = buildLiveActivityState(base);
    expect(state).toMatchObject({ phase: 'working', exerciseName: 'Bench', setLabel: 'Set 2 of 2', nextTarget: '100 kg × 8', nextSetId: 'a2', restSeconds: 120, startedAt: 1000 });
  });
  it('resting: the countdown end from the rest that is running', () => {
    expect(buildLiveActivityState({ ...base, restStartedAt: 5000, restFor: 60 })).toMatchObject({ phase: 'rest', restEndsAt: 65000 });
  });
  it('a timed set running: the clock from its true start, the target beside it', () => {
    expect(buildLiveActivityState({ ...base, clock: { setId: 'a2', startedAt: 10000, baseSec: 30, targetSec: 120 } })).toMatchObject({ phase: 'cardio', cardioStartedAt: -20000, cardioTargetSeconds: 120 });
  });
  it('a warm-up set rests for the shorter warm-up rest', () => {
    const w = session([exercise('a', 'Bench', [set('a1', 1, false, { warmup: true }), set('a2', 2)])]);
    const state = buildLiveActivityState({ ...base, session: w });
    expect(state.setLabel).toBe('Warm-up set');
    expect(state.restSeconds).toBeLessThan(120);
  });
  it('everything logged: no target and no check', () => {
    const done = session([exercise('a', 'Bench', [set('a1', 1, true)])]);
    expect(buildLiveActivityState({ ...base, session: done })).toMatchObject({ setLabel: 'All sets logged', nextSetId: undefined, nextTarget: undefined });
  });
});

describe('describeFinish', () => {
  it('reads sets, volume in the lifter\'s unit and records, leaving out zeros', () => {
    expect(describeFinish(18, 5000, 1, units)).toBe('18 sets · 5,000 kg · 1 record');
    expect(describeFinish(1, 0, 0, units)).toBe('1 set');
    expect(describeFinish(3, 100, 2, { weight: 'lb', distance: 'mi' })).toBe('3 sets · 220 lb · 2 records');
  });
});
