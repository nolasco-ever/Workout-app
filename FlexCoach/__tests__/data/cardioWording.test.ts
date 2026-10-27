import { Session, SessionExercise } from '../../data/models';
import { cardioStats, countWorkingSets, describeLogged } from '../../data/engine/stats';
import { droppedLine, finishPrompt } from '../../screens/Tabs/Workout/components/finishPrompt';
import { buildLiveActivityState, describeFinish } from '../../screens/Tabs/Workout/components/liveActivityState';
import { entry, lastSession, set } from './support/fixtures';

const bench = (sets = [set(), set({ setNumber: 2 }), set({ setNumber: 3, completed: false })]) => lastSession({}, sets, entry({ exerciseName: 'Bench' }));
const run = (done = true, overrides: Partial<SessionExercise> = {}): SessionExercise => ({
  ...lastSession({ durationSec: 1200, distanceM: 3218.688 }, [set({ weightKg: null, reps: null, durationSec: 1200, distanceM: 3218.688, completed: done })], entry({ exerciseId: 'Running', exerciseName: 'Running', measurement: 'distance_time' })),
  ...overrides,
});
const session = (exercises: SessionExercise[]): Session => ({
  id: 's', ownerId: 'u', planId: null, cycleId: null, occurrenceId: null, workoutId: null, workoutName: 'Mixed', date: '2026-10-25',
  startedAt: 0, finishedAt: 1, status: 'completed', exercises, createdAt: 0, updatedAt: 0,
});

describe('cardio is not a set', () => {
  it('counts only lifting as sets and names the cardio', () => {
    const s = session([bench(), run()]);
    expect(countWorkingSets([s])).toBe(2);
    expect(describeLogged([s])).toEqual(['2 sets', 'Running']);
    expect(describeLogged([session([run()])])).toEqual(['Running']);
    expect(cardioStats(s, 'mi')).toEqual([{ label: 'Running', value: '2 mi · 20:00' }]);
  });

  it('asks before finishing in sets and names', () => {
    expect(finishPrompt(session([bench(), run()]))).toEqual({ title: 'Finish early?', message: '2 of 3 sets and Running logged. 1 set stays unlogged.' });
    expect(finishPrompt(session([bench(), run(false)]))).toEqual({ title: 'Finish early?', message: '2 of 3 sets logged. 1 set and Running stay unlogged.' });
    expect(finishPrompt(session([run()]))).toEqual({ title: 'Finish workout?', message: 'Running logged. Nice work.' });
    expect(finishPrompt(session([run(false)]))).toEqual({ nothing: 'Log Running before finishing.' });
    expect(finishPrompt(session([bench([set({ completed: false })])]))).toEqual({ nothing: 'Mark at least one set done before finishing.' });
  });

  it('warns about dropping cardio without calling it sets', () => {
    expect(droppedLine(run(), true)).toBe('What you logged for Running will be dropped.');
    expect(droppedLine(bench(), true)).toBe('The 2 sets you logged for Bench will be dropped.');
  });

  it('labels the cardio entry by its target on the Watch and the Island', () => {
    const state = buildLiveActivityState({ session: session([run(false)]), index: 0, drafts: {}, units: { weight: 'lb', distance: 'mi' }, restStartedAt: null, restFor: 90, restSec: 90, clock: null });
    expect(state.setLabel).toBe('2 mi · 20:00');
    expect(state.exercises?.[0].cardio).toBe(true);
    expect(describeFinish(0, 0, 0, { weight: 'lb', distance: 'mi' }, ['Running'])).toBe('Running');
    expect(describeFinish(12, 0, 0, { weight: 'lb', distance: 'mi' }, ['Running'])).toBe('12 sets · Running');
  });
});
