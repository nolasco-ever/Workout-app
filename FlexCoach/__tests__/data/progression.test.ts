import { buildPlannedSets, buildWarmupSets, previousCycleId, progressExercise, progressPlan, warmupRamp, warmupRestSec } from '../../data/engine/progression';
import { describeProgression } from '../../data/engine/progressionCopy';
import { kgToLb, lbToKg } from '../../data/engine/units';
import { Session, SetTarget } from '../../data/models';
import { entry, lastSession, rotationPlan, set } from './support/fixtures';

const three = (weightKg: number, reps: number) => [set({ weightKg, reps }), set({ weightKg, reps }), set({ weightKg, reps })];

describe('progressExercise: weighted lifts, judged per cycle', () => {
  it('starts from the plan when nothing has been logged', () => {
    const p = progressExercise(entry(), [], null, 'kg');
    expect(p.change).toBe('start');
    expect(p.target).toEqual({ sets: 3, reps: 10, weightKg: 30, durationSec: null, distanceM: null });
  });

  it('adds weight and restarts reps at the bottom when every session hit the top of the range', () => {
    const logs = [lastSession({ reps: 10, weightKg: 30 }, three(30, 10)), lastSession({ reps: 10, weightKg: 30 }, three(30, 10))];
    const p = progressExercise(entry(), logs, null, 'kg');
    expect(p.change).toBe('increase');
    expect(p.target).toMatchObject({ reps: 8, weightKg: 32.5 });
    expect(p.sessions).toBe(2);
    expect(p.hits).toBe(2);
  });

  it('moves only the sets that hit in every session; a missed set eases back', () => {
    const logs = [lastSession({ reps: 10, weightKg: 30 }, three(30, 10)), lastSession({ reps: 10, weightKg: 30 }, [set({ reps: 10 }), set({ reps: 9 }), set({ reps: 8 })])];
    const p = progressExercise(entry(), logs, null, 'kg');
    expect(p.change).toBe('increase');
    expect(p.target.perSet).toEqual([
      { weightKg: 32.5, reps: 8 },
      { weightKg: 30, reps: 9 },
      { weightKg: 30, reps: 8 },
    ]);
    expect(p.hits).toBe(1);
  });

  it('holds everything when every set missed in some session', () => {
    const logs = [lastSession({ reps: 10, weightKg: 30 }, three(30, 10)), lastSession({ reps: 10, weightKg: 30 }, three(30, 9))];
    const p = progressExercise(entry(), logs, null, 'kg');
    expect(p.change).toBe('drop');
    expect(p.target).toEqual({ sets: 3, reps: 9, weightKg: 30, durationSec: null, distanceM: null });
  });

  it('does not raise the weight after a single session (the cycle decides, not the session)', () => {
    // One log at the top of the range but it's the only one this cycle: still an increase, because the whole cycle was hit.
    // What must not happen is a mid-cycle change: startSession reads targetsForCycle, which only looks at earlier cycles.
    const sessions: Session[] = [
      { ...base('s1', 'c1', 100), exercises: [lastSession({ reps: 10, weightKg: 30 }, three(30, 10))] },
    ];
    const plan = planWith(entry());
    // Cycle c1 is still running: its own sessions are not judged.
    const targets = progressPlan(plan, sessions, previousCycleId(sessions, plan, { id: 'c1', createdAt: 50 }), 'kg', 50);
    expect(targets[0].change).toBe('start');
    expect(targets[0].target.weightKg).toBe(30);
  });

  it('never drops below the bottom of the range', () => {
    const logs = [lastSession({ reps: 10, weightKg: 35 }, [set({ weightKg: 35, reps: 5 }), set({ weightKg: 35, reps: 5 }), set({ weightKg: 35, reps: 4 })])];
    expect(progressExercise(entry(), logs, null, 'kg').target).toMatchObject({ reps: 8, weightKg: 35 });
  });

  it('climbs reps to what was managed every time, at least one step', () => {
    const logs = [lastSession({ reps: 8, weightKg: 35 }, three(35, 9)), lastSession({ reps: 8, weightKg: 35 }, three(35, 10))];
    const p = progressExercise(entry(), logs, null, 'kg');
    expect(p.change).toBe('climb');
    expect(p.target).toMatchObject({ reps: 9, weightKg: 35 });
  });

  it('progresses each set on its own, so a ramp stays a ramp', () => {
    const logs = [
      lastSession({ reps: 10, weightKg: 25, perSet: [{ weightKg: 25, reps: 10 }, { weightKg: 30, reps: 10 }, { weightKg: 35, reps: 10 }] }, [set({ weightKg: 25, reps: 10 }), set({ weightKg: 30, reps: 10 }), set({ weightKg: 35, reps: 8 })]),
    ];
    const p = progressExercise(entry(), logs, null, 'kg');
    expect(p.target.perSet).toEqual([
      { weightKg: 27.5, reps: 8 },
      { weightKg: 32.5, reps: 8 },
      { weightKg: 35, reps: 8 },
    ]);
    expect(p.change).toBe('increase');
  });

  it('treats a set that was never done as a miss for that set only', () => {
    const logs = [lastSession({ reps: 10, weightKg: 30 }, [set({ reps: 10 }), set({ reps: 10 })])];
    const p = progressExercise(entry(), logs, null, 'kg');
    expect(p.target.perSet).toEqual([
      { weightKg: 32.5, reps: 8 },
      { weightKg: 32.5, reps: 8 },
      { weightKg: 30, reps: 8 },
    ]);
  });

  it('carries the last target forward when the exercise was not trained in the cycle', () => {
    const fallback = lastSession({ reps: 9, weightKg: 35 }, three(35, 9));
    const p = progressExercise(entry(), [], fallback, 'kg');
    expect(p.change).toBe('hold');
    expect(p.target).toMatchObject({ reps: 9, weightKg: 35 });
  });

  it('ignores warm-up sets when judging', () => {
    const logs = [lastSession({ reps: 10, weightKg: 30 }, [set({ reps: 8, weightKg: 15, warmup: true }), ...three(30, 10)])];
    expect(progressExercise(entry(), logs, null, 'kg').target.weightKg).toBe(32.5);
  });
});

describe('progressExercise: bodyweight reps', () => {
  const pullUps = () => entry({ measurement: 'reps', exerciseName: 'Pull Ups', startingWeightKg: null, repRangeMin: 6, repRangeMax: 10 });

  it('keeps growing reps past the top when no weight is added', () => {
    const logs = [lastSession({ reps: 10, weightKg: null }, [set({ weightKg: null, reps: 10 }), set({ weightKg: null, reps: 10 }), set({ weightKg: null, reps: 11 })], pullUps())];
    expect(progressExercise(pullUps(), logs, null, 'kg').target).toMatchObject({ reps: 11, weightKg: null });
  });

  it('adds weight when the lifter is already using added weight', () => {
    const logs = [lastSession({ reps: 10, weightKg: 10 }, three(10, 10), pullUps())];
    expect(progressExercise(pullUps(), logs, null, 'kg').target).toMatchObject({ reps: 6, weightKg: 12.5 });
  });
});

describe('progressExercise: timed and cardio', () => {
  it('adds the duration step when every set of every session reached the target', () => {
    const plank = entry({ measurement: 'time', sets: 2, repRangeMin: null, repRangeMax: null, startingWeightKg: null, startingDurationSec: 30 });
    const logs = [lastSession({ durationSec: 30 }, [set({ weightKg: null, reps: null, durationSec: 30 }), set({ weightKg: null, reps: null, durationSec: 35 })], plank)];
    expect(progressExercise(plank, logs, null, 'kg').target).toMatchObject({ durationSec: 40, reps: null });
  });

  it('falls back to the shortest completed hold after a miss', () => {
    const plank = entry({ measurement: 'time', sets: 2, startingDurationSec: 60 });
    const logs = [lastSession({ durationSec: 60 }, [set({ durationSec: 60 }), set({ durationSec: 45 })], plank)];
    expect(progressExercise(plank, logs, null, 'kg').target).toMatchObject({ durationSec: 45 });
  });

  it('repeats last cardio distance and duration, plus the optional step', () => {
    const run = entry({ measurement: 'distance_time', sets: 1, startingDistanceM: 3000, startingDurationSec: 1200, progression: { weightIncrementKg: 0, repStep: 0, durationStepSec: 0, distanceStepM: 200 } });
    const logs = [lastSession({ distanceM: 3000, durationSec: 1200 }, [set({ weightKg: null, reps: null, distanceM: 3200, durationSec: 1250 })], run)];
    expect(progressExercise(run, logs, null, 'kg').target).toMatchObject({ distanceM: 3400, durationSec: 1250 });
  });
});

describe('progressExercise: loadable weights', () => {
  it('lands a pound-based increase on a 2.5 lb step', () => {
    const e = entry({ progression: { weightIncrementKg: lbToKg(5), repStep: 1, durationStepSec: 10, distanceStepM: 0 } });
    const fifty = lbToKg(50);
    const logs = [lastSession({ reps: 10, weightKg: fifty }, three(fifty, 10), e)];
    expect(kgToLb(progressExercise(e, logs, null, 'lb').target.weightKg!)).toBeCloseTo(55, 5);
  });

  it('rounds a 2.5 kg increment to the nearest 2.5 lb for pound users', () => {
    const fifty = lbToKg(50);
    const logs = [lastSession({ reps: 10, weightKg: fifty }, three(fifty, 10))];
    expect(kgToLb(progressExercise(entry(), logs, null, 'lb').target.weightKg!)).toBeCloseTo(55, 5);
  });

  it('keeps kilogram users on 1.25 kg steps', () => {
    const logs = [lastSession({ reps: 10, weightKg: 30 }, three(30, 10))];
    expect(progressExercise(entry(), logs, null, 'kg').target).toMatchObject({ weightKg: 32.5 });
  });
});

const base = (id: string, cycleId: string, startedAt: number): Session => ({
  id,
  ownerId: 'user-1',
  planId: 'plan-1',
  cycleId,
  occurrenceId: null,
  workoutId: 'push',
  workoutName: 'Push',
  date: '2026-09-01',
  startedAt,
  finishedAt: startedAt + 3600_000,
  status: 'completed',
  exercises: [],
  createdAt: startedAt,
  updatedAt: startedAt,
});

const planWith = (...entries: ReturnType<typeof entry>[]) => {
  const plan = rotationPlan();
  plan.workouts[0].exercises = entries;
  return plan;
};

describe('progressPlan across cycles', () => {
  it('judges the previous cycle and leaves the running one alone', () => {
    const e = entry();
    const plan = planWith(e);
    const sessions: Session[] = [
      { ...base('s1', 'c1', 100), exercises: [lastSession({ reps: 10, weightKg: 30 }, three(30, 10), e)] },
      { ...base('s2', 'c1', 200), exercises: [lastSession({ reps: 10, weightKg: 30 }, three(30, 10), e)] },
      { ...base('s3', 'c2', 400), exercises: [lastSession({ reps: 8, weightKg: 32.5 }, three(32.5, 12), e)] },
    ];
    const c2 = { id: 'c2', createdAt: 300 };
    expect(previousCycleId(sessions, plan, c2)).toBe('c1');
    const [p] = progressPlan(plan, sessions, 'c1', 'kg', c2.createdAt);
    expect(p.change).toBe('increase');
    expect(p.target).toMatchObject({ reps: 8, weightKg: 32.5 });
  });

  it('has no previous cycle for a plan\'s first cycle', () => {
    const plan = planWith(entry());
    expect(previousCycleId([], plan, { id: 'c1', createdAt: 10 })).toBeNull();
  });

  it('falls back to the last log from another plan or cycle when the exercise was not in the judged cycle', () => {
    const e = entry();
    const plan = planWith(e);
    const sessions: Session[] = [{ ...base('s0', 'old', 10), planId: 'other', exercises: [lastSession({ reps: 9, weightKg: 40 }, three(40, 9), e)] }];
    const [p] = progressPlan(plan, sessions, null, 'kg');
    expect(p.change).toBe('hold');
    expect(p.target).toMatchObject({ reps: 9, weightKg: 40 });
  });
});

describe('describeProgression', () => {
  it('explains a weight increase with the reason', () => {
    const logs = [lastSession({ reps: 10, weightKg: 30 }, three(30, 10)), lastSession({ reps: 10, weightKg: 30 }, three(30, 10))];
    const p = progressExercise(entry(), logs, null, 'kg');
    const { headline, reason } = describeProgression(p, 'kg');
    expect(headline).toBe('30 kg → 32.5 kg, 8 reps');
    expect(reason).toContain('every set in all 2 sessions');
  });
});

describe('buildPlannedSets', () => {
  it('uses per-set goals when the target has them', () => {
    let n = 0;
    const target: SetTarget = { sets: 2, reps: 8, weightKg: 25, durationSec: null, distanceM: null, perSet: [{ weightKg: 25, reps: 8 }, { weightKg: 30, reps: 8 }] };
    const sets = buildPlannedSets(target, () => `s${++n}`);
    expect(sets.map(s => s.weightKg)).toEqual([25, 30]);
  });
});

describe('warm-up sets', () => {
  let n = 0;
  const id = () => `w${++n}`;
  const target = (weightKg: number | null) => ({ sets: 3, reps: 10, weightKg, durationSec: null, distanceM: null });

  it('gives a longer ramp for heavier working weights and none for light ones', () => {
    expect(warmupRamp(100)).toHaveLength(3);
    expect(warmupRamp(60)).toHaveLength(2);
    expect(warmupRamp(25)).toHaveLength(1);
    expect(warmupRamp(15)).toHaveLength(0);
  });

  it('rounds to plates in the user\'s unit and flags every set as a warm-up', () => {
    const kg = buildWarmupSets(target(100), 'kg', id);
    expect(kg.map(s => s.weightKg)).toEqual([40, 60, 80]);
    expect(kg.map(s => s.reps)).toEqual([8, 5, 3]);
    expect(kg.every(s => s.warmup && !s.completed)).toBe(true);
    expect(kg.map(s => s.setNumber)).toEqual([1, 2, 3]);

    const lb = buildWarmupSets(target(45.36), 'lb', id); // 100 lb
    expect(lb.map(s => Math.round(s.weightKg! / 0.45359237))).toEqual([50, 75]);
  });

  it('returns nothing without a weight to scale from', () => {
    expect(buildWarmupSets(target(null), 'lb', id)).toEqual([]);
    expect(buildWarmupSets(target(0), 'lb', id)).toEqual([]);
  });

  it('never suggests a warm-up at or above the working weight', () => {
    for (const w of [20, 21, 22.5, 24, 39, 40, 41, 79, 80, 81]) {
      for (const unit of ['kg', 'lb'] as const) {
        expect(buildWarmupSets(target(w), unit, id).every(s => s.weightKg! < w)).toBe(true);
      }
    }
  });
});

describe('warmupRestSec', () => {
  it('is half the working rest, between 15 and 60 seconds', () => {
    expect(warmupRestSec(90)).toBe(45);
    expect(warmupRestSec(180)).toBe(60);
    expect(warmupRestSec(20)).toBe(15);
  });
});
