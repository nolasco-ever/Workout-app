import { splitNotice, splitPlan } from '../../data/engine/planSplit';
import { ExerciseKind, Plan, Workout, WorkoutExercise } from '../../data/models';
import { entry, rotationPlan, weeklyPlan } from './support/fixtures';

// The kind rides on the exercise id here: "str-…", "stretch-…", "cardio-…".
const kindOf = (e: WorkoutExercise): ExerciseKind => (e.exerciseId.startsWith('cardio') ? 'cardio' : e.exerciseId.startsWith('stretch') ? 'stretching' : 'strength');
const ex = (exerciseId: string, name: string, order: number) => entry({ exerciseId, exerciseName: name, order });
let n = 0;
const newId = () => `new-${++n}`;
const workout = (id: string, name: string, exercises: WorkoutExercise[], type?: Workout['type']): Workout => ({ id, name, order: 0, exercises, ...(type ? { type } : {}) });

describe('splitting a plan (v1 #10.11)', () => {
  beforeEach(() => {
    n = 0;
  });

  it('splits the board plan: stretches before, cardio after, on the same days', () => {
    const lower = workout('lower', 'Lower Body', [ex('stretch-a', 'Hip Flexor Stretch', 0), ex('str-a', 'Squat', 1), ex('str-b', 'Lunge', 2), ex('cardio-t', 'Treadmill Running', 3)]);
    const plan: Plan = { ...weeklyPlan(), workouts: [lower], schedule: { mode: 'weekly', weekdays: [[], ['lower'], [], [], ['lower'], [], []], startWeekday: 1, weeksPerCycle: 4 } };
    const { plan: split, moves } = splitPlan(plan, kindOf, newId);
    expect(split.workouts.map(w => [w.name, w.type, w.exercises.map(e => e.exerciseName)])).toEqual([
      ['Lower Body stretches', 'stretching', ['Hip Flexor Stretch']],
      ['Lower Body', 'strength', ['Squat', 'Lunge']],
      ['Treadmill Running', 'cardio', ['Treadmill Running']],
    ]);
    const days = split.schedule.mode === 'weekly' ? split.schedule.weekdays : [];
    expect(days[1]).toEqual(['new-1', 'lower', 'new-2']);
    expect(days[4]).toEqual(['new-1', 'lower', 'new-2']);
    expect(moves).toEqual([
      { kind: 'stretching', name: 'Lower Body stretches', from: 'Lower Body', place: 'before', id: 'new-1', days: ['Mon', 'Thu'] },
      { kind: 'cardio', name: 'Treadmill Running', from: 'Lower Body', place: 'after', id: 'new-2', days: ['Mon', 'Thu'] },
    ]);
  });

  it('keeps the target with the exercise', () => {
    const run = entry({ exerciseId: 'cardio-r', exerciseName: 'Running', order: 0, startingDistanceM: 5000, startingDurationSec: 1800 });
    const plan: Plan = { ...rotationPlan(), workouts: [workout('w', 'Full', [run, ex('str-a', 'Squat', 1)])], schedule: { mode: 'rotation', slots: [['w'], []], passesPerCycle: 4 } };
    const { plan: split, moves } = splitPlan(plan, kindOf, newId);
    expect(split.workouts[0].exercises[0]).toMatchObject({ startingDistanceM: 5000, startingDurationSec: 1800, order: 0 });
    expect(moves[0]).toMatchObject({ place: 'before', days: ['Day 1'] });
  });

  it('turns a cardio-only workout into its cardio items, in its place', () => {
    const plan: Plan = { ...rotationPlan(), workouts: [workout('c', 'Cardio Day', [ex('cardio-r', 'Rowing, Stationary', 0), ex('cardio-b', 'Air Bike', 1)])], schedule: { mode: 'rotation', slots: [['c'], []], passesPerCycle: 4 } };
    const { plan: split, moves } = splitPlan(plan, kindOf, newId);
    expect(split.workouts.map(w => [w.name, w.type])).toEqual([['Rowing, Stationary', 'cardio'], ['Air Bike', 'cardio']]);
    expect(split.schedule.mode === 'rotation' && split.schedule.slots[0]).toEqual(['new-1', 'new-2']);
    expect(moves.map(m => m.place)).toEqual(['instead', 'instead']);
  });

  it('types a workout that only needs its kind, and leaves a typed plan alone', () => {
    const plan: Plan = { ...rotationPlan(), workouts: [workout('s', 'Mobility', [ex('stretch-a', 'Hamstring Stretch', 0)]), workout('p', 'Push', [ex('str-a', 'Bench', 0)])] };
    const { plan: split, moves } = splitPlan(plan, kindOf, newId);
    expect(split.workouts.map(w => w.type)).toEqual(['stretching', 'strength']);
    expect(moves).toEqual([]);
    expect(splitPlan(split, kindOf, newId).plan).toBe(split);
  });

  it('leaves cardio items and timed drills (strength) where they are', () => {
    const plan: Plan = { ...rotationPlan(), workouts: [workout('h', 'HIIT', [ex('str-burpee', 'Burpee', 0)], 'strength'), workout('r', 'Running', [ex('cardio-r', 'Running', 0)], 'cardio')] };
    expect(splitPlan(plan, kindOf, newId).plan).toBe(plan);
  });
});

describe('the plan split Notice', () => {
  const moves = [
    { kind: 'cardio' as const, name: 'Treadmill Running', from: 'Lower Body', place: 'after' as const, id: 'a', days: ['Mon', 'Thu'] },
    { kind: 'stretching' as const, name: 'Lower Body stretches', from: 'Lower Body', place: 'before' as const, id: 'b', days: ['Mon', 'Thu'] },
    { kind: 'cardio' as const, name: 'Rowing, Stationary', from: 'Cardio Day', place: 'instead' as const, id: 'c', days: ['Day 3'] },
  ];
  const flat = (t: (string | { bold: string })[]) => t.map(x => (typeof x === 'string' ? x : `**${x.bold}**`)).join('');

  it('reads as the board for one plan', () => {
    const notice = splitNotice([{ name: 'Main Plan', split: { at: 1, moves } }])!;
    expect(notice.intro).toBe('Cardio and stretching exercises now sit apart from strength exercises. In Main Plan we moved:');
    expect(notice.items.map(flat)).toEqual([
      '**Treadmill Running** is now its own cardio, after Lower Body on Mon and Thu.',
      '**Lower Body stretches** is a stretching workout of its own, before Lower Body on the same days.',
      '**Rowing, Stationary** is now its own cardio, in place of Cardio Day.',
    ]);
    expect(notice.footnote).toBe('Your history, records and targets are unchanged. Days already done this cycle stay as they are.');
  });

  it('names the plan on each line when several were split, and is null when nothing moved', () => {
    const notice = splitNotice([{ name: 'A', split: { at: 1, moves: [moves[0]] } }, { name: 'B', split: { at: 1, moves: [moves[2]] } }, { name: 'C', split: { at: 1, moves: [] } }])!;
    expect(notice.intro?.endsWith('We moved:')).toBe(true);
    expect(notice.items.map(flat)[1]).toBe('**Rowing, Stationary** is now its own cardio, in place of Cardio Day. (B)');
    expect(splitNotice([{ name: 'C', split: { at: 1, moves: [] } }, { name: 'D' }])).toBeNull();
  });
});
