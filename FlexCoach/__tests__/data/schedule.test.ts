import { closeCycle, generateCycle, getOverdueOccurrences, pushOccurrence, skipOccurrence, markOccurrence } from '../../data/engine/schedule';
import { summarizeCycle } from '../../data/engine/stats';
import { rotationPlan, weeklyPlan } from './support/fixtures';

const dates = (cycle: ReturnType<typeof generateCycle>) => cycle.occurrences.map(o => `${o.date}:${o.workoutId ?? 'rest'}:${o.status}`);

describe('generateCycle', () => {
  it('lays a rotation out on consecutive days starting on the given date', () => {
    const cycle = generateCycle(rotationPlan(), 'user-1', 1, '2026-09-21');
    expect(dates(cycle)).toEqual([
      '2026-09-21:push:scheduled',
      '2026-09-22:pull:scheduled',
      '2026-09-23:legs:scheduled',
      '2026-09-24:rest:rest',
    ]);
    expect(cycle.endDate).toBe('2026-09-24');
  });

  it('repeats the rotation passesPerCycle times', () => {
    const plan = rotationPlan();
    plan.schedule = { mode: 'rotation', slots: ['push', 'pull'], passesPerCycle: 3 };
    const cycle = generateCycle(plan, 'user-1', 1, '2026-09-21');
    expect(cycle.occurrences).toHaveLength(6);
    expect(cycle.endDate).toBe('2026-09-26');
  });

  it('starts a weekly plan on the next start weekday and pins workouts to weekdays', () => {
    // 2026-09-23 is a Wednesday; start weekday is Monday.
    const cycle = generateCycle(weeklyPlan(), 'user-1', 1, '2026-09-23');
    expect(cycle.startDate).toBe('2026-09-28');
    expect(cycle.endDate).toBe('2026-10-04');
    expect(dates(cycle).filter(d => !d.includes('rest'))).toEqual([
      '2026-09-28:push:scheduled',
      '2026-09-30:pull:scheduled',
      '2026-10-02:legs:scheduled',
    ]);
  });
});

describe('pushOccurrence', () => {
  it('cascades pushes through following workouts and grows a rotation cycle', () => {
    const plan = rotationPlan();
    const cycle = generateCycle(plan, 'user-1', 1, '2026-09-21');
    const pushed = pushOccurrence(cycle, plan, cycle.occurrences[0].id);
    expect(dates(pushed)).toEqual([
      '2026-09-21:rest:rest',
      '2026-09-22:push:scheduled',
      '2026-09-23:pull:scheduled',
      '2026-09-24:legs:scheduled',
    ]);
    expect(pushed.endDate).toBe('2026-09-24');
    expect(pushed.occurrences.find(o => o.workoutId === 'push')?.pushCount).toBe(1);
    expect(pushed.occurrences.find(o => o.workoutId === 'push')?.originalDate).toBe('2026-09-21');
  });

  it('extends a rotation cycle when the last workout is pushed', () => {
    const plan = rotationPlan();
    plan.schedule = { mode: 'rotation', slots: ['push', 'pull'], passesPerCycle: 1 };
    const cycle = generateCycle(plan, 'user-1', 1, '2026-09-21');
    const pushed = pushOccurrence(cycle, plan, cycle.occurrences[1].id);
    expect(pushed.endDate).toBe('2026-09-23');
  });

  it('swaps with a rest day inside a weekly cycle and keeps the boundary fixed', () => {
    const plan = weeklyPlan();
    const cycle = generateCycle(plan, 'user-1', 1, '2026-09-28');
    const push = cycle.occurrences.find(o => o.workoutId === 'push')!;
    const pushed = pushOccurrence(cycle, plan, push.id);
    expect(pushed.occurrences.find(o => o.workoutId === 'push')?.date).toBe('2026-09-29');
    expect(pushed.occurrences.find(o => o.workoutId === 'pull')?.date).toBe('2026-09-30');
    expect(pushed.endDate).toBe('2026-10-04');
  });

  it('marks a workout skipped when pushed past the end of a weekly cycle', () => {
    const plan = weeklyPlan();
    plan.schedule = { ...plan.schedule, weekdays: [null, 'push', null, 'pull', null, null, 'legs'] } as typeof plan.schedule;
    const cycle = generateCycle(plan, 'user-1', 1, '2026-09-28');
    const legs = cycle.occurrences.find(o => o.workoutId === 'legs')!;
    // Saturday -> Sunday is still inside the week; Sunday -> Monday is not.
    const once = pushOccurrence(cycle, plan, legs.id);
    expect(once.occurrences.find(o => o.workoutId === 'legs')).toMatchObject({ date: '2026-10-04', status: 'scheduled' });
    const twice = pushOccurrence(once, plan, legs.id);
    const after = twice.occurrences.find(o => o.workoutId === 'legs')!;
    expect(after.status).toBe('skipped');
    expect(after.skipReason).toBe('pushed_out');
    expect(after.date).toBe('2026-10-04');
    expect(after.pushCount).toBe(2);
  });

  it('refuses to push a completed workout', () => {
    const plan = rotationPlan();
    const cycle = generateCycle(plan, 'user-1', 1, '2026-09-21');
    const done = markOccurrence(cycle, cycle.occurrences[0].id, 'completed', 'session-1');
    expect(() => pushOccurrence(done, plan, cycle.occurrences[0].id)).toThrow(/Only scheduled/);
  });
});

describe('overdue detection, skipping, and closing', () => {
  it('lists scheduled workouts whose date has passed', () => {
    const cycle = generateCycle(rotationPlan(), 'user-1', 1, '2026-09-21');
    expect(getOverdueOccurrences(cycle, '2026-09-23').map(o => o.workoutId)).toEqual(['push', 'pull']);
  });

  it('closes a cycle by skipping whatever is left and reports the next start', () => {
    const cycle = generateCycle(rotationPlan(), 'user-1', 1, '2026-09-21');
    const { cycle: closed, nextStart } = closeCycle(cycle);
    expect(closed.status).toBe('completed');
    expect(closed.occurrences.filter(o => o.status === 'skipped')).toHaveLength(3);
    expect(nextStart).toBe('2026-09-25');
  });

  it('summarises completed, on-time, pushed, and skipped counts', () => {
    const plan = rotationPlan();
    let cycle = generateCycle(plan, 'user-1', 1, '2026-09-21');
    const [push, pull, legs] = cycle.occurrences;
    cycle = markOccurrence(cycle, push.id, 'completed', 's1');
    cycle = pushOccurrence(cycle, plan, pull.id);
    cycle = markOccurrence(cycle, pull.id, 'completed', 's2');
    cycle = skipOccurrence(cycle, legs.id);
    const summary = summarizeCycle(cycle, [], []);
    expect(summary).toMatchObject({ totalWorkouts: 3, completed: 2, completedOnTime: 1, pushed: 2, skipped: 1 });
    expect(summary.completionRate).toBeCloseTo(2 / 3);
  });
});
