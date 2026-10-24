import { calendarMonth, calendarMonths, streakRuns, summarizeStreaks, trainingDays } from '../../data/engine/streaks';
import { Session } from '../../data/models';

const session = (date: string, startedAt: number, status: Session['status'] = 'completed'): Session =>
  ({ id: `s-${date}-${startedAt}`, date, startedAt, status, exercises: [], workoutName: 'Upper' }) as unknown as Session;

describe('streaks', () => {
  it('groups finished workouts by day, in the order they started', () => {
    const days = trainingDays([session('2026-10-22', 20), session('2026-10-22', 10), session('2026-10-21', 5, 'in_progress' as Session['status'])]);
    expect([...days.keys()]).toEqual(['2026-10-22']);
    expect(days.get('2026-10-22')!.map(s => s.startedAt)).toEqual([10, 20]);
  });

  it('finds runs of consecutive days across a month end', () => {
    expect(streakRuns(['2026-09-29', '2026-09-30', '2026-10-01', '2026-10-03'])).toEqual([
      { length: 3, start: '2026-09-29', end: '2026-10-01' },
      { length: 1, start: '2026-10-03', end: '2026-10-03' },
    ]);
  });

  it('keeps the current streak alive through today until today is over', () => {
    const days = ['2026-10-21', '2026-10-22', '2026-10-23'];
    expect(summarizeStreaks(days, '2026-10-24').current).toMatchObject({ length: 3 });
    expect(summarizeStreaks(days, '2026-10-25').current).toBeNull();
  });

  it('takes the longest run as the best, the latest on a tie', () => {
    const { best } = summarizeStreaks(['2026-09-08', '2026-09-09', '2026-10-01', '2026-10-02'], '2026-10-24');
    expect(best).toEqual({ length: 2, start: '2026-10-01', end: '2026-10-02' });
  });

  it('lays a month out in weeks starting on Sunday', () => {
    const october = calendarMonth(2026, 9);
    expect(october.weeks[0]).toEqual([null, null, null, null, '2026-10-01', '2026-10-02', '2026-10-03']);
    expect(october.weeks.every(w => w.length === 7)).toBe(true);
    expect(october.weeks.flat().filter(Boolean)).toHaveLength(31);
  });

  it('pages from the first training month to this one, across a year end', () => {
    expect(calendarMonths('2025-11-12', '2026-01-05').map(m => [m.year, m.month])).toEqual([[2025, 10], [2025, 11], [2026, 0]]);
    expect(calendarMonths(null, '2026-10-24').map(m => [m.year, m.month])).toEqual([[2026, 9]]);
  });
});
