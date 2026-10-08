import { ACHIEVEMENT_FAMILIES, achievementIdOf, computeNewUnlocks, familyOf, materialFor, measureAchievements, parseAchievementId, progressFor, thresholdsFor, tierLabel, tierReached, unlockCopy } from '../../data/engine/achievements';
import { BUDDY_LADDERS, tiersReached } from '../../functions/src/ladders';
import { Cycle, Session } from '../../data/models';
import { entry, lastSession, set } from './support/fixtures';

const at = (date: string, hour: number): number => new Date(`${date}T${String(hour).padStart(2, '0')}:00:00`).getTime();

const session = (id: string, date: string, hour = 17, exercises: Session['exercises'] = []): Session => ({
  id,
  ownerId: 'user-1',
  planId: 'plan-1',
  cycleId: 'c1',
  occurrenceId: null,
  workoutId: 'push',
  workoutName: 'Push',
  date,
  startedAt: at(date, hour),
  finishedAt: at(date, hour) + 3600_000,
  status: 'completed',
  exercises,
  createdAt: at(date, hour),
  updatedAt: at(date, hour),
});

const lift = (weightKg: number, reps: number) => lastSession({ reps, weightKg }, [set({ weightKg, reps }), set({ weightKg, reps }), set({ weightKg, reps })], entry());

const cycle = (id: string, statuses: ('completed' | 'skipped' | 'rest')[], extra: Partial<Cycle> = {}): Cycle => ({
  id,
  ownerId: 'user-1',
  planId: 'plan-1',
  number: 1,
  startDate: '2026-09-01',
  endDate: '2026-09-07',
  status: 'completed',
  occurrences: statuses.map((status, i) => ({ id: `${id}-${i}`, workoutId: status === 'rest' ? null : 'push', workoutName: status === 'rest' ? null : 'Push', date: `2026-09-0${i + 1}`, originalDate: `2026-09-0${i + 1}`, status, pushCount: 0, skipReason: null, sessionId: null })),
  createdAt: 1,
  updatedAt: 1,
  ...extra,
});

const empty = { sessions: [], cycles: [], buddies: 0, planUses: 0, unit: 'lb' as const };

describe('ladders', () => {
  it('every family climbs, and the server families use the shared ladder', () => {
    for (const f of ACHIEVEMENT_FAMILIES) {
      for (let i = 1; i < f.tiers.length; i++) expect(f.tiers[i]).toBeGreaterThan(f.tiers[i - 1]);
    }
    expect(familyOf('buddies').tiers).toEqual([...BUDDY_LADDERS.buddies]);
    expect(familyOf('plan_uses').tiers).toEqual([...BUDDY_LADDERS.plan_uses]);
    expect(familyOf('volume').tiersKg).toHaveLength(familyOf('volume').tiers.length);
  });

  it('maps tiers to materials, bronze first, diamond at the top', () => {
    expect(materialFor(1)).toBe('bronze');
    expect(materialFor(3)).toBe('gold');
    expect(materialFor(8)).toBe('diamond');
    expect(materialFor(12)).toBe('diamond');
  });

  it('round-trips achievement ids', () => {
    expect(parseAchievementId(achievementIdOf('streak', 3))).toEqual({ family: 'streak', tier: 3 });
    expect(parseAchievementId('nope:1')).toBeNull();
    expect(parseAchievementId('streak:0')).toBeNull();
  });

  it('labels tiers in plain words', () => {
    expect(tierLabel('workouts', 1, 'lb')).toBe('1 workout');
    expect(tierLabel('workouts', 100, 'lb')).toBe('100 workouts');
    expect(tierLabel('streak', 30, 'lb')).toBe('30-day streak');
    expect(tierLabel('volume', 50_000, 'lb')).toBe('50k lb moved');
    expect(tierLabel('volume', 1_000_000, 'kg')).toBe('1M kg moved');
    expect(tierLabel('buddies', 1, 'lb')).toBe('1 buddy');
    expect(tierLabel('plan_uses', 5, 'lb')).toBe('5 buddies on your plans');
  });

  it('picks the kilogram ladder for kilogram users', () => {
    expect(thresholdsFor(familyOf('volume'), 'kg')[0]).toBe(5_000);
    expect(thresholdsFor(familyOf('volume'), 'lb')[0]).toBe(10_000);
    expect(thresholdsFor(familyOf('workouts'), 'kg')).toEqual(familyOf('workouts').tiers);
  });
});

describe('measureAchievements', () => {
  it('counts workouts, the longest streak, and time of day', () => {
    const sessions = [session('a', '2026-09-01', 5), session('b', '2026-09-02', 23), session('c', '2026-09-03'), session('d', '2026-09-10', 22)];
    const v = measureAchievements({ ...empty, sessions });
    expect(v.workouts).toBe(4);
    expect(v.streak).toBe(3);
    expect(v.early_bird).toBe(1);
    expect(v.night_owl).toBe(2);
  });

  it('measures volume in the user\'s unit', () => {
    const sessions = [session('a', '2026-09-01', 17, [lift(100, 10)])];
    expect(measureAchievements({ ...empty, sessions, unit: 'kg' }).volume).toBe(3000);
    expect(Math.round(measureAchievements({ ...empty, sessions, unit: 'lb' }).volume)).toBe(6614);
  });

  it('counts only records that beat an earlier best', () => {
    const sessions = [session('a', '2026-09-01', 17, [lift(100, 10)]), session('b', '2026-09-03', 17, [lift(100, 10)]), session('c', '2026-09-05', 17, [lift(105, 10)])];
    expect(measureAchievements({ ...empty, sessions }).records).toBe(1);
  });

  it('counts cycles once reviewed or closed, and perfect ones separately', () => {
    const cycles = [
      cycle('closed', ['completed', 'rest', 'completed']),
      cycle('reviewed', ['completed', 'skipped'], { status: 'active', reportReviewedAt: 5 }),
      cycle('running', ['completed', 'scheduled' as any], { status: 'active' }),
      cycle('empty', ['skipped', 'skipped']),
    ];
    const v = measureAchievements({ ...empty, cycles });
    expect(v.cycles).toBe(2);
    expect(v.perfect_cycles).toBe(1);
  });

  it('passes buddy counts through', () => {
    const v = measureAchievements({ ...empty, buddies: 3, planUses: 1 });
    expect(v.buddies).toBe(3);
    expect(v.plan_uses).toBe(1);
  });
});

describe('tiers and progress', () => {
  it('reports the tier reached and the way to the next one', () => {
    const workouts = familyOf('workouts');
    expect(tierReached(workouts, 0, 'lb')).toBe(0);
    expect(tierReached(workouts, 10, 'lb')).toBe(2);
    const p = progressFor(workouts, 30, 'lb');
    expect(p.tier).toBe(3);
    expect(p.next).toBe(50);
    expect(p.fraction).toBeCloseTo(0.2);
    expect(progressFor(workouts, 5000, 'lb')).toMatchObject({ tier: 8, next: null, fraction: 1 });
  });

  it('keeps a stored tier when the measured value falls short of it', () => {
    const p = progressFor(familyOf('volume'), 100, 'kg', [{ family: 'volume', tier: 2 }]);
    expect(p.tier).toBe(2);
  });
});

describe('computeNewUnlocks', () => {
  const values = { ...measureAchievements(empty), workouts: 30, buddies: 6 };

  it('unlocks every tier reached that is not stored yet, lowest first', () => {
    const out = computeNewUnlocks(values, [{ achievementId: 'workouts:1' }], 'lb', 'device', 100);
    expect(out.map(u => u.achievementId)).toEqual(['workouts:2', 'workouts:3', 'buddies:1', 'buddies:2']);
    expect(out[0]).toMatchObject({ family: 'workouts', tier: 2, threshold: 10, value: 30, source: 'device', celebratedAt: null, unlockedAt: 100 });
  });

  it('judges only the families it is given', () => {
    const device = ACHIEVEMENT_FAMILIES.filter(f => f.judgedBy === 'device');
    const out = computeNewUnlocks(values, [], 'lb', 'device', 100, device);
    expect(out.every(u => u.family !== 'buddies')).toBe(true);
    expect(out).toHaveLength(3);
  });

  it('writes nothing when everything is stored', () => {
    const all = computeNewUnlocks(values, [], 'lb', 'backfill', 1);
    expect(computeNewUnlocks(values, all, 'lb', 'device', 2)).toEqual([]);
  });

  it('matches the server ladder', () => {
    expect(tiersReached('buddies', 6).map(t => t.tier)).toEqual([1, 2]);
    expect(tiersReached('plan_uses', 0)).toEqual([]);
  });

  it('words the feed item by tier', () => {
    expect(unlockCopy({ family: 'streak', tier: 1, threshold: 7 }, 'lb').title).toBe('Badge unlocked: 7-day streak 🏅');
    expect(unlockCopy({ family: 'streak', tier: 3, threshold: 30 }, 'lb').body).toContain('gold');
  });
});
