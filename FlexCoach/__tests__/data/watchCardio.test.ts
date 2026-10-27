import { cardioKind } from '../../data/liveActivity/cardioKind';
import { onWatchDistance, parseWatchDistance, receiveWatchDistance, takeWatchDistance } from '../../data/liveActivity/watchDistance';
import { fromDraft } from '../../screens/Tabs/Workout/components/setDrafts';
import { buildLiveActivityState } from '../../screens/Tabs/Workout/components/liveActivityState';
import { Session } from '../../data/models';
import { entry, lastSession, set } from './support/fixtures';

const units = { weight: 'lb', distance: 'mi' } as const;

describe('cardioKind', () => {
  it('measures distance for runs, walks and outdoor rides only', () => {
    expect(cardioKind('0685')).toEqual({ activity: 'running', outdoor: true, distance: true });
    expect(cardioKind('0684')).toEqual({ activity: 'running', outdoor: false, distance: true });
    expect(cardioKind('Bicycling')).toEqual({ activity: 'cycling', outdoor: true, distance: true });
    expect(cardioKind('2141')).toEqual({ activity: 'elliptical', outdoor: false, distance: false });
    expect(cardioKind('Rowing_Stationary').distance).toBe(false);
    expect(cardioKind('3196')).toEqual({ activity: 'mixedCardio', outdoor: false, distance: false });
  });
});

describe('watch distance', () => {
  it('parses the Watch message and hands over what came before listening', () => {
    expect(parseWatchDistance('abc:1609.3')).toEqual({ setId: 'abc', meters: 1609.3 });
    expect(parseWatchDistance('abc:0')).toBeNull();
    receiveWatchDistance('early', 500);
    const heard: [string, number][] = [];
    const off = onWatchDistance((id, m) => heard.push([id, m]));
    receiveWatchDistance('later', 800);
    off();
    takeWatchDistance('early');
    takeWatchDistance('later');
    expect(heard).toEqual([['early', 500], ['later', 800]]);
  });

  it("keeps the Watch's distance until a different one is typed", () => {
    const run = lastSession({}, [], entry({ measurement: 'distance_time' }));
    const measured = set({ weightKg: null, reps: null, distanceM: 2000, durationSec: 600, distanceSource: 'watch' });
    expect(fromDraft(run, measured, { a: '1.24', b: '600' }, units)).toMatchObject({ distanceM: 2000, distanceSource: 'watch' });
    const typed = fromDraft(run, measured, { a: '1.5', b: '600' }, units);
    expect(typed.distanceSource).toBeUndefined();
    expect(typed.distanceM).toBeCloseTo(2414, 0);
  });

  it('tells the Watch what the cardio entry is', () => {
    const run = { ...lastSession({ durationSec: 1200 }, [set({ weightKg: null, reps: null, completed: false })], entry({ exerciseId: '0685', exerciseName: 'Running', measurement: 'distance_time' })) };
    const session: Session = { id: 's', ownerId: 'u', planId: null, cycleId: null, occurrenceId: null, workoutId: null, workoutName: 'Run', date: '2026-10-25', startedAt: 0, finishedAt: null, status: 'in_progress', exercises: [run], createdAt: 0, updatedAt: 0 };
    const state = buildLiveActivityState({ session, index: 0, drafts: {}, units, restStartedAt: null, restFor: 90, restSec: 90, clock: null });
    expect(state).toMatchObject({ cardioActivity: 'running', cardioOutdoor: true, cardioDistance: true, distanceUnit: 'mi', setLabel: '20:00' });
  });
});
