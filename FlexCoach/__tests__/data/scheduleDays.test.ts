import { mapScheduleDays, normalizePlan, normalizeSchedule, scheduledIds } from '../../data/engine/scheduleDays';
import { Plan, Schedule } from '../../data/models';
import { rotationPlan, weeklyPlan } from './support/fixtures';

// Plans saved before several items a day (v1 #10) held one id or null per day.
const old = (schedule: unknown) => schedule as Schedule;

describe('normalizeSchedule', () => {
  it('reads an old rotation as one-item and empty days', () => {
    expect(normalizeSchedule(old({ mode: 'rotation', slots: ['push', null, 'legs'], passesPerCycle: 2 }))).toEqual({ mode: 'rotation', slots: [['push'], [], ['legs']], passesPerCycle: 2 });
  });

  it('reads an old weekly schedule the same way, always seven days', () => {
    const s = normalizeSchedule(old({ mode: 'weekly', weekdays: [null, 'push', null, 'pull'], startWeekday: 1, weeksPerCycle: 1 }));
    expect(s.mode === 'weekly' && s.weekdays).toEqual([[], ['push'], [], ['pull'], [], [], []]);
  });

  it('leaves a new schedule as it is', () => {
    expect(normalizeSchedule(rotationPlan().schedule)).toEqual(rotationPlan().schedule);
    expect(normalizeSchedule(weeklyPlan().schedule)).toEqual(weeklyPlan().schedule);
  });

  it('passes a missing plan through', () => {
    expect(normalizePlan(null)).toBeNull();
    const plan: Plan = { ...rotationPlan(), schedule: old({ mode: 'rotation', slots: ['push', null], passesPerCycle: 1 }) };
    expect(normalizePlan(plan).schedule).toEqual({ mode: 'rotation', slots: [['push'], []], passesPerCycle: 1 });
  });
});

describe('schedule day helpers', () => {
  it('lists every scheduled item and maps days', () => {
    const plan = weeklyPlan();
    expect(scheduledIds(plan.schedule)).toEqual(['push', 'pull', 'legs']);
    const dropped = mapScheduleDays(plan.schedule, day => day.filter(id => id !== 'pull'));
    expect(scheduledIds(dropped)).toEqual(['push', 'legs']);
  });
});
