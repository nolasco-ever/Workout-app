import { currentStreakDays, findPersonalRecords, totalVolumeKg, volumeByMuscle } from '../../data/engine/stats';
import { addDays } from '../../data/engine/dates';
import { Session } from '../../data/models';
import { lastSession, set } from './support/fixtures';

const session = (id: string, date: string, exercises: Session['exercises'], startedAt = 0): Session => ({
  id,
  ownerId: 'user-1',
  planId: null,
  cycleId: null,
  occurrenceId: null,
  workoutId: null,
  workoutName: 'Push',
  date,
  startedAt,
  finishedAt: startedAt + 1,
  status: 'completed',
  exercises,
  createdAt: 0,
  updatedAt: 0,
});

describe('personal records', () => {
  it('flags a heavier top set than anything in history', () => {
    const history = [session('h1', '2026-09-01', [lastSession({}, [set({ weightKg: 60 })])])];
    const current = [session('c1', '2026-09-08', [lastSession({}, [set({ weightKg: 62.5 })])], 10)];
    const prs = findPersonalRecords(current, history);
    expect(prs).toHaveLength(1);
    expect(prs[0]).toMatchObject({ kind: 'weight', value: 62.5, previousValue: 60, sessionId: 'c1' });
  });

  it('does not flag a repeat of the existing record', () => {
    const history = [session('h1', '2026-09-01', [lastSession({}, [set({ weightKg: 60 })])])];
    const current = [session('c1', '2026-09-08', [lastSession({}, [set({ weightKg: 60 })])])];
    expect(findPersonalRecords(current, history)).toHaveLength(0);
  });
});

describe('volume and streaks', () => {
  it('sums weight times reps for completed sets only', () => {
    const s = session('s1', '2026-09-08', [lastSession({}, [set({ weightKg: 50, reps: 10 }), set({ weightKg: 50, reps: 10, completed: false })])]);
    expect(totalVolumeKg([s])).toBe(500);
  });

  it('buckets volume by primary muscle', () => {
    const s = session('s1', '2026-09-08', [lastSession({}, [set({ weightKg: 50, reps: 10 })])]);
    const out = volumeByMuscle([s], () => ['chest']);
    expect(out.chest).toEqual({ volumeKg: 500, sets: 1, reps: 10 });
  });

  it('counts consecutive completed days ending today or yesterday', () => {
    const s = (d: string) => session(d, d, []);
    expect(currentStreakDays([s('2026-09-19'), s('2026-09-20'), s('2026-09-21')], '2026-09-21', addDays)).toBe(3);
    expect(currentStreakDays([s('2026-09-19'), s('2026-09-20')], '2026-09-21', addDays)).toBe(2);
    expect(currentStreakDays([s('2026-09-18')], '2026-09-21', addDays)).toBe(0);
  });
});

describe('warm-up sets in stats', () => {
  it('count neither toward volume nor records', () => {
    const ex = lastSession({ reps: 10, weightKg: 100 }, [set({ reps: 8, weightKg: 120, warmup: true, completed: true }), set({ reps: 10, weightKg: 100 })]);
    const s = session('s1', '2026-09-25', [ex]);
    expect(totalVolumeKg([s])).toBe(1000);
    const prs = findPersonalRecords([s], []);
    expect(prs).toHaveLength(1);
    expect(prs[0].value).toBe(100);
  });
});
