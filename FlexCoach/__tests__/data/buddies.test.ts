import { bestRecord, buildPublicProfile, favoriteExercise, formatInviteCode, generateInviteCode, inviteUrl, isStreakMilestone, longestStreakDays, parseInviteCode } from '../../data/engine/buddies';
import { Session } from '../../data/models';
import { lastSession, set } from './support/fixtures';

const session = (id: string, date: string, exercises: Session['exercises'] = []): Session => ({
  id,
  ownerId: 'u1',
  planId: null,
  cycleId: null,
  occurrenceId: null,
  workoutId: null,
  workoutName: 'Push',
  date,
  startedAt: 0,
  finishedAt: 1,
  status: 'completed',
  exercises,
  createdAt: 0,
  updatedAt: 0,
});

describe('invite codes', () => {
  it('generates six unambiguous characters', () => {
    const code = generateInviteCode();
    expect(code).toMatch(/^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{6}$/);
  });

  it('parses the QR link, the formatted code, and sloppy typing', () => {
    expect(parseInviteCode(inviteUrl('K7MP2X'))).toBe('K7MP2X');
    expect(parseInviteCode(formatInviteCode('K7MP2X'))).toBe('K7MP2X');
    expect(parseInviteCode(' flx k7mp2x ')).toBe('K7MP2X');
    expect(parseInviteCode('k7mp2x')).toBe('K7MP2X');
  });

  it('rejects anything that is not a code', () => {
    expect(parseInviteCode('')).toBeNull();
    expect(parseInviteCode('K7MP2')).toBeNull();
    expect(parseInviteCode('K7MP2XY')).toBeNull();
    expect(parseInviteCode('K7MP0O')).toBeNull(); // 0 and O are not in the alphabet
    expect(parseInviteCode('https://example.com/other/K7MP2X')).toBeNull();
  });
});

describe('streaks and records', () => {
  it('finds the longest run of consecutive days', () => {
    const s = ['2026-09-01', '2026-09-02', '2026-09-03', '2026-09-10', '2026-09-11'].map((d, i) => session(`s${i}`, d));
    expect(longestStreakDays(s)).toBe(3);
    expect(longestStreakDays([])).toBe(0);
  });

  it('milestones every five days', () => {
    expect([0, 1, 4, 5, 9, 10, 15].map(isStreakMilestone)).toEqual([false, false, false, true, false, true, true]);
  });

  it('prefers the heaviest weight record and names the exercise', () => {
    const bench = lastSession({ reps: 10, weightKg: 60 }, [set({ reps: 10, weightKg: 60 })]);
    bench.exerciseName = 'Bench Press';
    const squat = lastSession({ reps: 5, weightKg: 100 }, [set({ reps: 5, weightKg: 100 }), set({ reps: 5, weightKg: 120, warmup: true })]);
    squat.exerciseName = 'Squat';
    const best = bestRecord([session('a', '2026-09-01', [bench, squat])]);
    expect(best).toEqual({ exerciseName: 'Squat', kind: 'weight', value: 100 });
  });

  it('picks the exercise logged in the most sessions as the favourite', () => {
    const mk = (name: string) => {
      const ex = lastSession({ reps: 10, weightKg: 30 }, [set()]);
      ex.exerciseName = name;
      return ex;
    };
    const s = [session('a', '2026-09-01', [mk('Squat'), mk('Bench')]), session('b', '2026-09-02', [mk('Squat')])];
    expect(favoriteExercise(s)).toBe('Squat');
    expect(favoriteExercise([])).toBeNull();
  });
});

describe('buildPublicProfile', () => {
  it('summarises without leaking sets', () => {
    const ex = lastSession({ reps: 10, weightKg: 50 }, [set({ reps: 10, weightKg: 50 })]);
    const card = buildPublicProfile({
      uid: 'u1',
      profile: null,
      sessions: [session('a', '2026-09-24', [ex]), session('b', '2026-09-25', [ex])],
      unlocks: [],
      plans: [],
      lastCycleCompletionRate: 0.75,
      skippedLastScheduled: false,
      todayDate: '2026-09-25',
      now: 123,
    });
    expect(card).toMatchObject({ id: 'u1', totalSessions: 2, currentStreakDays: 2, longestStreakDays: 2, lastWorkoutDate: '2026-09-25', totalVolumeKg: 1000, lastCycleCompletionRate: 0.75, updatedAt: 123 });
    expect(card.bestRecord?.value).toBe(50);
    expect(JSON.stringify(card)).not.toContain('"sets"');
  });
});
