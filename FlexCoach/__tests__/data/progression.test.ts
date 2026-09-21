import { suggestTarget } from '../../data/engine/progression';
import { entry, lastSession, set } from './support/fixtures';

describe('suggestTarget: weighted lifts (double progression)', () => {
  it('uses the plan starting values when there is no history', () => {
    expect(suggestTarget(entry(), null)).toEqual({ sets: 3, reps: 10, weightKg: 30, durationSec: null, distanceM: null });
  });

  it('adds weight and keeps reps at the top when every set hits the top of the range', () => {
    const last = lastSession({ reps: 10, weightKg: 30 }, [set({ reps: 10 }), set({ reps: 10 }), set({ reps: 10 })]);
    expect(suggestTarget(entry(), last)).toMatchObject({ reps: 10, weightKg: 32.5 });
  });

  it('drops reps to what was achieved after a miss, holding the weight', () => {
    const last = lastSession({ reps: 10, weightKg: 35 }, [set({ weightKg: 35, reps: 10 }), set({ weightKg: 35, reps: 8 }), set({ weightKg: 35, reps: 8 })]);
    expect(suggestTarget(entry(), last)).toMatchObject({ reps: 8, weightKg: 35 });
  });

  it('never drops below the bottom of the range', () => {
    const last = lastSession({ reps: 10, weightKg: 35 }, [set({ weightKg: 35, reps: 5 }), set({ weightKg: 35, reps: 5 }), set({ weightKg: 35, reps: 4 })]);
    expect(suggestTarget(entry(), last)).toMatchObject({ reps: 8, weightKg: 35 });
  });

  it('climbs back up one rep per successful session', () => {
    const last = lastSession({ reps: 8, weightKg: 35 }, [set({ weightKg: 35, reps: 8 }), set({ weightKg: 35, reps: 9 }), set({ weightKg: 35, reps: 8 })]);
    expect(suggestTarget(entry(), last)).toMatchObject({ reps: 9, weightKg: 35 });
  });

  it('treats an incomplete session (fewer sets) as a miss', () => {
    const last = lastSession({ reps: 10, weightKg: 30 }, [set({ reps: 10 }), set({ reps: 10 })]);
    expect(suggestTarget(entry(), last)).toMatchObject({ reps: 10, weightKg: 30 });
  });

  it('walks the full example: 30x10 hit -> 35x10 miss at 8 -> 35x8 -> 35x9 -> 35x10 -> 40x10', () => {
    const e = entry({ progression: { weightIncrementKg: 5, repStep: 1, durationStepSec: 10, distanceStepM: 0 } });
    let t = suggestTarget(e, lastSession({ reps: 10, weightKg: 30 }, [set(), set(), set()], e));
    expect(t).toMatchObject({ reps: 10, weightKg: 35 });
    t = suggestTarget(e, lastSession(t, [set({ weightKg: 35, reps: 8 }), set({ weightKg: 35, reps: 8 }), set({ weightKg: 35, reps: 8 })], e));
    expect(t).toMatchObject({ reps: 8, weightKg: 35 });
    t = suggestTarget(e, lastSession(t, [set({ weightKg: 35, reps: 8 }), set({ weightKg: 35, reps: 8 }), set({ weightKg: 35, reps: 8 })], e));
    expect(t).toMatchObject({ reps: 9, weightKg: 35 });
    t = suggestTarget(e, lastSession(t, [set({ weightKg: 35, reps: 9 }), set({ weightKg: 35, reps: 9 }), set({ weightKg: 35, reps: 9 })], e));
    expect(t).toMatchObject({ reps: 10, weightKg: 35 });
    t = suggestTarget(e, lastSession(t, [set({ weightKg: 35, reps: 10 }), set({ weightKg: 35, reps: 10 }), set({ weightKg: 35, reps: 10 })], e));
    expect(t).toMatchObject({ reps: 10, weightKg: 40 });
  });
});

describe('suggestTarget: bodyweight reps', () => {
  const pullUps = () => entry({ measurement: 'reps', exerciseName: 'Pull Ups', startingWeightKg: null, repRangeMin: 6, repRangeMax: 10 });

  it('keeps growing reps past the top when no weight is added', () => {
    const last = lastSession({ reps: 10, weightKg: null }, [set({ weightKg: null, reps: 10 }), set({ weightKg: null, reps: 10 }), set({ weightKg: null, reps: 11 })], pullUps());
    expect(suggestTarget(pullUps(), last)).toMatchObject({ reps: 11, weightKg: null });
  });

  it('adds weight when the lifter is already using added weight', () => {
    const last = lastSession({ reps: 10, weightKg: 10 }, [set({ weightKg: 10, reps: 10 }), set({ weightKg: 10, reps: 10 }), set({ weightKg: 10, reps: 10 })], pullUps());
    expect(suggestTarget(pullUps(), last)).toMatchObject({ reps: 10, weightKg: 12.5 });
  });
});

describe('suggestTarget: timed and cardio', () => {
  it('adds the duration step to a hold when all sets reach the target', () => {
    const plank = entry({ measurement: 'time', sets: 2, repRangeMin: null, repRangeMax: null, startingWeightKg: null, startingDurationSec: 30 });
    const last = lastSession({ durationSec: 30 }, [set({ weightKg: null, reps: null, durationSec: 30 }), set({ weightKg: null, reps: null, durationSec: 35 })], plank);
    expect(suggestTarget(plank, last)).toMatchObject({ durationSec: 40, reps: null });
  });

  it('falls back to the shortest completed hold after a miss', () => {
    const plank = entry({ measurement: 'time', sets: 2, startingDurationSec: 60 });
    const last = lastSession({ durationSec: 60 }, [set({ durationSec: 60 }), set({ durationSec: 45 })], plank);
    expect(suggestTarget(plank, last)).toMatchObject({ durationSec: 45 });
  });

  it('repeats last cardio distance and duration, plus the optional step', () => {
    const run = entry({ measurement: 'distance_time', sets: 1, startingDistanceM: 3000, startingDurationSec: 1200, progression: { weightIncrementKg: 0, repStep: 0, durationStepSec: 0, distanceStepM: 200 } });
    const last = lastSession({ distanceM: 3000, durationSec: 1200 }, [set({ weightKg: null, reps: null, distanceM: 3200, durationSec: 1250 })], run);
    expect(suggestTarget(run, last)).toMatchObject({ distanceM: 3400, durationSec: 1250 });
  });
});
