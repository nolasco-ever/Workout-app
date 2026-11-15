import { Cycle, Occurrence } from '../../data/models';
import { cycleReportReadyAt, healCycleReport, isCycleReportReady, reportReadyAfter, settleCycleReport } from '../../data/engine/cycleReport';

const MORNING = { hour: 9, minute: 0 };
const local = (y: number, m: number, d: number, h: number, min = 0) => new Date(y, m - 1, d, h, min, 0, 0).getTime();

const occ = (id: string, date: string, status: Occurrence['status']): Occurrence => ({ id, workoutId: status === 'rest' ? null : 'w', workoutName: status === 'rest' ? null : 'Push', date, originalDate: date, status, pushCount: 0, skipReason: null, sessionId: null });
const cycle = (occurrences: Occurrence[], extra: Partial<Cycle> = {}): Cycle => ({
  id: 'c1', ownerId: 'u', planId: 'p', number: 2, startDate: '2026-09-30', endDate: '2026-10-06', status: 'active', occurrences, createdAt: 1, updatedAt: 1, ...extra,
});

describe('reportReadyAfter', () => {
  it('lands two hours after the last workout during the day', () => {
    expect(reportReadyAfter(local(2026, 10, 5, 14, 30), MORNING)).toBe(local(2026, 10, 5, 16, 30));
  });
  it('waits for the next morning after a late finish', () => {
    expect(reportReadyAfter(local(2026, 10, 5, 21, 0), MORNING)).toBe(local(2026, 10, 6, 9, 0));
  });
  it('waits for the morning reminder after a finish in the small hours', () => {
    expect(reportReadyAfter(local(2026, 10, 6, 4, 0), MORNING)).toBe(local(2026, 10, 6, 9, 0));
  });
});

describe('settleCycleReport', () => {
  it('stamps the report time only when the last workout is resolved, once', () => {
    const open = cycle([occ('a', '2026-10-03', 'completed'), occ('b', '2026-10-05', 'scheduled')]);
    expect(settleCycleReport(open, local(2026, 10, 5, 12), MORNING)).toBe(open);
    const done = cycle([occ('a', '2026-10-03', 'completed'), occ('b', '2026-10-05', 'completed'), occ('r', '2026-10-06', 'rest')]);
    const stamped = settleCycleReport(done, local(2026, 10, 5, 12), MORNING);
    expect(stamped.reportReadyAt).toBe(local(2026, 10, 5, 14));
    expect(settleCycleReport(stamped, local(2026, 10, 5, 18), MORNING)).toBe(stamped);
  });
  it('counts a skip as resolving the last workout', () => {
    const done = cycle([occ('a', '2026-10-03', 'completed'), occ('b', '2026-10-05', 'skipped')]);
    expect(settleCycleReport(done, local(2026, 10, 5, 12), MORNING).reportReadyAt).toBe(local(2026, 10, 5, 14));
  });
});

describe('cycleReportReadyAt', () => {
  it('is null while workouts are open, the stamp when there is one, else the morning after the end date', () => {
    expect(cycleReportReadyAt(cycle([occ('a', '2026-10-05', 'scheduled')]), MORNING)).toBeNull();
    expect(cycleReportReadyAt(cycle([occ('a', '2026-10-05', 'completed')], { reportReadyAt: 123 }), MORNING)).toBe(123);
    expect(cycleReportReadyAt(cycle([occ('a', '2026-10-05', 'completed')]), MORNING)).toBe(local(2026, 10, 7, 9, 0));
  });
  it('is ready once the time has passed', () => {
    const c = cycle([occ('a', '2026-10-05', 'completed')], { reportReadyAt: local(2026, 10, 5, 14) });
    expect(isCycleReportReady(c, MORNING, local(2026, 10, 5, 13, 59))).toBe(false);
    expect(isCycleReportReady(c, MORNING, local(2026, 10, 5, 14))).toBe(true);
  });
});

describe('healCycleReport (build 21 feedback)', () => {
  const NOW = local(2026, 11, 12, 15, 14);
  it('makes the report ready now when every workout is resolved but no time was stamped', () => {
    const c = cycle([occ('a', '2026-11-09', 'completed'), occ('b', '2026-11-10', 'skipped'), occ('r', '2026-11-12', 'rest'), occ('r2', '2026-11-13', 'rest')], { endDate: '2026-11-13' });
    expect(healCycleReport(c, NOW).reportReadyAt).toBe(NOW);
    expect(isCycleReportReady(healCycleReport(c, NOW), MORNING, NOW)).toBe(true);
  });
  it('leaves a cycle alone while a workout is still open, or once a time is stamped', () => {
    const open = cycle([occ('a', '2026-11-09', 'completed'), occ('b', '2026-11-14', 'scheduled')]);
    expect(healCycleReport(open, NOW)).toBe(open);
    const stamped = cycle([occ('a', '2026-11-09', 'completed')], { reportReadyAt: 5 });
    expect(healCycleReport(stamped, NOW)).toBe(stamped);
    const closed = cycle([occ('a', '2026-11-09', 'completed')], { status: 'completed' });
    expect(healCycleReport(closed, NOW)).toBe(closed);
  });
});
