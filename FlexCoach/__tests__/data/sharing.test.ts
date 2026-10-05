import { Session } from '../../data/models';
import { defaultSharingPrefs, finishedWorkoutNotice, recordSeries, sharedDetail, sharedExercisesOf, withSharingDefaults } from '../../data/engine/sharing';

const set = (n: number, weightKg: number | null, reps: number | null, completed = true, warmup = false) => ({
  id: `s${n}`, setNumber: n, weightKg, reps, durationSec: null, distanceM: null, completed, completedAt: completed ? 1 : null, warmup,
});

const session: Session = {
  id: 'sess', ownerId: 'u', planId: null, cycleId: null, occurrenceId: null, workoutId: null, workoutName: 'Upper',
  date: '2026-10-01', startedAt: 1, finishedAt: 2, status: 'completed', createdAt: 1, updatedAt: 2,
  exercises: [
    { id: 'e2', workoutExerciseId: null, exerciseId: 'row', exerciseName: 'Row', measurement: 'weight_reps', order: 2, notes: null, target: { sets: 1, reps: 10, weightKg: 40, durationSec: null, distanceM: null }, sets: [set(1, 40, 10)] },
    { id: 'e1', workoutExerciseId: null, exerciseId: 'bench', exerciseName: 'Bench Press', measurement: 'weight_reps', order: 1, notes: null, target: { sets: 2, reps: 8, weightKg: 60, durationSec: null, distanceM: null }, sets: [set(1, 30, 8, true, true), set(2, 60, 8), set(3, 65, 6), set(4, 70, 5, false)] },
    { id: 'e3', workoutExerciseId: null, exerciseId: 'skipped', exerciseName: 'Curl', measurement: 'weight_reps', order: 3, notes: null, target: { sets: 1, reps: 10, weightKg: 10, durationSec: null, distanceM: null }, sets: [set(1, 10, 10, false)] },
  ],
};

describe('sharing', () => {
  it('defaults everything on and fills in missing keys', () => {
    expect(withSharingDefaults(null)).toEqual(defaultSharingPrefs);
    expect(withSharingDefaults({ weight: false })).toEqual({ ...defaultSharingPrefs, weight: false });
  });

  it('shares every completed set with all fields when everything is on', () => {
    const shared = sharedExercisesOf(session, defaultSharingPrefs)!;
    expect(shared.map(e => e.name)).toEqual(['Bench Press', 'Row']);
    expect(shared[0].sets).toEqual([
      { warmup: true, weightKg: 30, reps: 8, durationSec: null, distanceM: null },
      { weightKg: 60, reps: 8, durationSec: null, distanceM: null },
      { weightKg: 65, reps: 6, durationSec: null, distanceM: null },
    ]);
    expect(shared[0].top).toBeUndefined();
  });

  it('drops the hidden fields from each set', () => {
    const shared = sharedExercisesOf(session, { ...defaultSharingPrefs, weight: false })!;
    expect(shared[0].sets![1]).toEqual({ reps: 8, durationSec: null, distanceM: null });
    const repsOff = sharedExercisesOf(session, { ...defaultSharingPrefs, reps: false })!;
    expect(repsOff[0].sets![1]).toEqual({ weightKg: 60 });
  });

  it('keeps only the best set when sets are hidden, and nothing but names when all three are off', () => {
    const noSets = sharedExercisesOf(session, { ...defaultSharingPrefs, sets: false })!;
    expect(noSets[0].sets).toBeUndefined();
    expect(noSets[0].top).toEqual({ weightKg: 65, reps: 8, durationSec: null, distanceM: null });
    const namesOnly = sharedExercisesOf(session, { ...defaultSharingPrefs, sets: false, reps: false, weight: false })!;
    expect(namesOnly).toEqual([{ name: 'Bench Press', exerciseId: 'bench', measurement: 'weight_reps' }, { name: 'Row', exerciseId: 'row', measurement: 'weight_reps' }]);
  });

  it('shares nothing when workouts are private', () => {
    expect(sharedExercisesOf(session, { ...defaultSharingPrefs, workouts: false })).toBeNull();
  });

  it('totals line follows the totals toggle', () => {
    expect(sharedDetail(session, defaultSharingPrefs, 'kg')).toBe('3 sets · 1270 kg moved');
    expect(sharedDetail(session, { ...defaultSharingPrefs, totals: false }, 'kg')).toBeNull();
  });

  it('builds the record series from the best working set of each completed session', () => {
    const earlier: Session = { ...session, id: 'old', date: '2026-09-20', startedAt: 0, exercises: [{ ...session.exercises[1], sets: [set(1, 50, 8), set(2, 55, 6)] }] };
    const abandoned: Session = { ...session, id: 'gone', date: '2026-09-25', startedAt: 0.5, status: 'abandoned' };
    expect(recordSeries([session, abandoned, earlier], 'bench', 'weight')).toEqual([
      { date: '2026-09-20', value: 55 },
      { date: '2026-10-01', value: 65 },
    ]);
    expect(recordSeries([session, earlier], 'bench', 'reps')).toEqual([
      { date: '2026-09-20', value: 8 },
      { date: '2026-10-01', value: 8 },
    ]);
    expect(recordSeries([session, earlier], 'bench', 'weight', 1)).toEqual([{ date: '2026-10-01', value: 65 }]);
    expect(recordSeries([session], 'nope', 'weight')).toEqual([]);
  });
});

describe('finishedWorkoutNotice', () => {
  it('names a planned workout as before', () => {
    expect(finishedWorkoutNotice('Eli', { ...session, planId: 'p', cycleId: 'c' }, defaultSharingPrefs, 0)).toEqual({ title: 'Eli finished Upper', body: 'Tap to see how it went.' });
    expect(finishedWorkoutNotice('Eli', { ...session, planId: 'p', cycleId: 'c' }, defaultSharingPrefs, 3).body).toBe('3 new records');
  });

  it('says what an ad-hoc quick workout was', () => {
    const quick: Session = { ...session, workoutName: 'Quick workout' };
    expect(finishedWorkoutNotice('Eli', quick, defaultSharingPrefs, 1)).toEqual({ title: 'Eli got a quick workout in', body: 'Bench Press, Row · 1 new record' });
    const more: Session = { ...quick, exercises: [...quick.exercises, { ...quick.exercises[0], id: 'e4', exerciseId: 'x', exerciseName: 'Curl', order: 4 }, { ...quick.exercises[0], id: 'e5', exerciseId: 'y', exerciseName: 'Shrug', order: 5 }] };
    expect(finishedWorkoutNotice('Eli', more, defaultSharingPrefs, 0).body).toBe('Bench Press, Row + 2 more');
    expect(finishedWorkoutNotice('Eli', { ...quick, exercises: [] }, defaultSharingPrefs, 0).body).toBe('Tap to see how it went.');
  });

  it('keeps the plan name for a quick workout copied from the plan', () => {
    expect(finishedWorkoutNotice('Eli', { ...session, workoutName: 'Upper' }, defaultSharingPrefs, 0).title).toBe('Eli finished Upper');
  });
});
