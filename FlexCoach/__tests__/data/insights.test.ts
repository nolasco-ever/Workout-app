import { estimateOneRepMax, exerciseHistory, weeklySeries, weightChangeSince, weightSeries, weekStart } from '../../data/engine/insights';
import { BodyWeightEntry, Session } from '../../data/models';
import { lastSession, set } from './support/fixtures';

const session = (id: string, date: string, exercises: Session['exercises'], startedAt = 0): Session => ({
  id, ownerId: 'u', planId: null, cycleId: null, occurrenceId: null, workoutId: null, workoutName: 'W', date, startedAt, finishedAt: startedAt + 1, status: 'completed', exercises, createdAt: 0, updatedAt: 0,
});

describe('weekly series', () => {
  it('starts weeks on Monday', () => {
    expect(weekStart('2026-09-21')).toBe('2026-09-21'); // Monday
    expect(weekStart('2026-09-27')).toBe('2026-09-21'); // Sunday
  });

  it('buckets volume and sessions into the right weeks, oldest first', () => {
    const s1 = session('a', '2026-09-15', [lastSession({}, [set({ weightKg: 50, reps: 10 })])]);
    const s2 = session('b', '2026-09-22', [lastSession({}, [set({ weightKg: 60, reps: 10 }), set({ weightKg: 60, reps: 8 })])]);
    const weeks = weeklySeries([s1, s2], '2026-09-23', 3);
    expect(weeks.map(w => w.weekStart)).toEqual(['2026-09-07', '2026-09-14', '2026-09-21']);
    expect(weeks[1]).toMatchObject({ volumeKg: 500, sessions: 1, sets: 1 });
    expect(weeks[2]).toMatchObject({ volumeKg: 1080, sessions: 1, sets: 2 });
  });
});

describe('exercise history', () => {
  it('reports top set, Epley estimate, reps, and volume per session', () => {
    const s = session('a', '2026-09-15', [lastSession({}, [set({ weightKg: 100, reps: 5 }), set({ weightKg: 90, reps: 8 })])], 5);
    const h = exerciseHistory([s], 'Barbell_Bench_Press_-_Medium_Grip');
    expect(h).toHaveLength(1);
    expect(h[0].topWeightKg).toBe(100);
    expect(h[0].estOneRepMaxKg).toBeCloseTo(Math.max(estimateOneRepMax(100, 5), estimateOneRepMax(90, 8)));
    expect(h[0].totalReps).toBe(13);
    expect(h[0].volumeKg).toBe(1220);
  });
});

describe('weight series', () => {
  const entry = (date: string, weightKg: number, createdAt = 0): BodyWeightEntry => ({ id: date + createdAt, ownerId: 'u', date, weightKg, source: 'manual', createdAt, updatedAt: createdAt });

  it('keeps one point per day, last entry winning, with a smoothed trend', () => {
    const s = weightSeries([entry('2026-09-01', 80), entry('2026-09-01', 81, 5), entry('2026-09-02', 82)]);
    expect(s).toHaveLength(2);
    expect(s[0].weightKg).toBe(81);
    expect(s[1].trendKg).toBeCloseTo(81 + 0.1 * (82 - 81));
  });

  it('measures change in trend since a date', () => {
    const s = weightSeries([entry('2026-09-01', 80), entry('2026-09-10', 80), entry('2026-09-20', 78)]);
    expect(weightChangeSince(s, '2026-09-05')!).toBeLessThan(0);
    expect(weightChangeSince(s, '2026-09-25')).toBeNull();
  });
});

describe('muscle breakdown', () => {
  it('attributes sets, reps, volume, and contributing exercises per primary muscle', () => {
    const { muscleBreakdown } = require('../../data/engine/insights');
    const s1 = session('a', '2026-09-15', [lastSession({}, [set({ weightKg: 50, reps: 10 }), set({ weightKg: 50, reps: 8 })])]);
    const s2 = session('b', '2026-09-17', [lastSession({}, [set({ weightKg: 55, reps: 10 })])]);
    const out = muscleBreakdown([s1, s2], () => ['chest', 'triceps']);
    expect(out).toHaveLength(2);
    expect(out[0]).toMatchObject({ sets: 3, reps: 28, volumeKg: 1450, sessions: 2 });
    expect(out[0].exercises[0]).toMatchObject({ exerciseName: 'Bench Press', sets: 3 });
  });
});

describe('muscle weekly series', () => {
  it('buckets one muscle by week', () => {
    const { muscleWeeklySeries } = require('../../data/engine/insights');
    const s1 = session('a', '2026-09-15', [lastSession({}, [set({ weightKg: 50, reps: 10 })])]);
    const s2 = session('b', '2026-09-22', [lastSession({}, [set({ weightKg: 60, reps: 10 })])]);
    const out = muscleWeeklySeries([s1, s2], 'chest', () => ['chest'], '2026-09-23', 2);
    expect(out.map((p: { sets: number }) => p.sets)).toEqual([1, 1]);
    expect(out[1].volumeKg).toBe(600);
    expect(muscleWeeklySeries([s1, s2], 'lats', () => ['chest'], '2026-09-23', 2).every((p: { sets: number }) => p.sets === 0)).toBe(true);
  });
});
