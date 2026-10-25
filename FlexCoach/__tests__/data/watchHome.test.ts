import { generateCycle, getOccurrenceForDate, getUpcomingOccurrences, markOccurrence } from '../../data/engine/schedule';
import { Session } from '../../data/models';
import { buildWatchHome, recentExercises } from '../../data/liveActivity/watchHome';
import { entry, lastSession, rotationPlan, set } from './support/fixtures';

const session = (startedAt: number, exercises: Session['exercises']): Session => ({
  id: `s-${startedAt}`,
  ownerId: 'user-1',
  planId: null,
  cycleId: null,
  occurrenceId: null,
  workoutId: null,
  workoutName: 'Quick workout',
  date: '2026-09-20',
  startedAt,
  finishedAt: startedAt + 1,
  status: 'completed',
  exercises,
  createdAt: 0,
  updatedAt: 0,
});

const plan = () => {
  const p = rotationPlan();
  p.workouts[0].exercises = [entry({ exerciseName: 'Bench Press', sets: 3 }), entry({ exerciseName: 'Fly', exerciseId: 'Cable_Fly', sets: 2, order: 1 })];
  return p;
};

const build = (todayDate: string, cycle = generateCycle(plan(), 'user-1', 1, '2026-09-21')) =>
  buildWatchHome({
    plan: plan(),
    cycle,
    todayDate,
    todayOccurrence: getOccurrenceForDate(cycle, todayDate) ?? null,
    upcoming: getUpcomingOccurrences(cycle, todayDate),
    inProgress: null,
    cycleFinished: false,
    history: [],
    unit: 'lb',
  });

describe('buildWatchHome', () => {
  it('mirrors the Workout tab on a workout day', () => {
    const home = build('2026-09-21');
    expect(home.headline).toEqual({ overline: 'PPL · Cycle 1', title: 'Day 1 of 4', progress: '0 of 3 done' });
    expect(home.today).toMatchObject({ kind: 'workout', name: 'Push', status: 'scheduled' });
    expect(home.days.map(d => `${d.name}:${d.status}:${d.startLabel ?? '-'}`)).toEqual([
      'Push:scheduled:Start workout',
      'Pull:scheduled:Do this workout today',
      'Legs:scheduled:Do this workout today',
      'Rest:rest:-',
    ]);
    expect(home.days[0].today).toBe(true);
    expect(home.workouts.push.exercises).toEqual([
      { name: expect.any(String), sets: 3 },
      { name: 'Fly', sets: 2 },
    ]);
  });

  it('says rest day and what is next on a rest day', () => {
    const home = build('2026-09-24');
    expect(home.today).toMatchObject({ kind: 'rest', heading: 'Rest day', text: 'Nothing else scheduled this cycle.' });
  });

  it('offers no start for a finished day, and resume in place of today with a workout going', () => {
    const fresh = generateCycle(plan(), 'user-1', 1, '2026-09-21');
    const cycle = markOccurrence(fresh, fresh.occurrences[0].id, 'completed', 's-1');
    expect(build('2026-09-22', cycle).days[0]).toMatchObject({ status: 'completed' });
    expect(build('2026-09-22', cycle).days[0].startLabel).toBeUndefined();
    const going = buildWatchHome({ plan: plan(), cycle, todayDate: '2026-09-22', todayOccurrence: null, upcoming: [], inProgress: session(5, []), cycleFinished: false, history: [], unit: 'lb' });
    expect(going.inProgress).toEqual({ sessionId: 's-5', name: 'Quick workout' });
    expect(going.today).toBeUndefined();
    expect(going.days.every(d => !d.startLabel)).toBe(true);
  });

  it('explains an empty home without a plan', () => {
    const home = buildWatchHome({ plan: null, cycle: null, todayDate: '2026-09-21', todayOccurrence: null, upcoming: [], inProgress: null, cycleFinished: false, history: [], unit: 'lb' });
    expect(home.empty?.title).toBe('No active plan');
    expect(home.days).toEqual([]);
  });
});

describe('recentExercises', () => {
  it('lists each exercise once, newest first, with its last working set', () => {
    const bench = entry({ exerciseId: 'Bench', exerciseName: 'Bench' });
    const run = entry({ exerciseId: 'Run', exerciseName: 'Run', measurement: 'time' });
    const older = session(1, [lastSession({}, [set({ weightKg: 50, reps: 5 })], bench)]);
    const newer = session(2, [
      lastSession({}, [set({ weightKg: 60, reps: 8 }), set({ weightKg: 20, reps: 10, warmup: true })], bench),
      lastSession({}, [set({ weightKg: null, reps: null, durationSec: 1200 })], run),
      lastSession({}, [set({ completed: false })], entry({ exerciseId: 'Never', exerciseName: 'Never' })),
    ]);
    const recent = recentExercises([older, newer], 'kg');
    expect(recent.map(r => `${r.name}:${r.last}`)).toEqual(['Bench:60 kg × 8', 'Run:20:00']);
  });
});
