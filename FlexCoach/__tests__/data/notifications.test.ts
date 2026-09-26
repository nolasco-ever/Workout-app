import { defaultNotificationPrefs, planLocalNotifications, planRestOverNotification, withPrefDefaults } from '../../data/engine/notifications';
import { Cycle, Occurrence, Session } from '../../data/models';

const TODAY = '2026-09-25'; // a Friday
const MORNING = new Date(2026, 8, 25, 7, 0).getTime();
const EVENING = new Date(2026, 8, 25, 20, 0).getTime();

const occ = (date: string, name: string | null, status: Occurrence['status'] = name ? 'scheduled' : 'rest'): Occurrence => ({
  id: `o-${date}`,
  workoutId: name ? `w-${name}` : null,
  workoutName: name,
  date,
  originalDate: date,
  status,
  pushCount: 0,
  skipReason: null,
  sessionId: null,
});

const cycle = (occurrences: Occurrence[], overrides: Partial<Cycle> = {}): Cycle => ({
  id: 'c1',
  ownerId: 'u1',
  planId: 'p1',
  number: 2,
  startDate: occurrences[0].date,
  endDate: '2026-10-31',
  status: 'active',
  occurrences,
  createdAt: 0,
  updatedAt: 0,
  ...overrides,
});

const session = (date: string, status: Session['status'] = 'completed'): Session => ({
  id: `s-${date}`,
  ownerId: 'u1',
  planId: 'p1',
  cycleId: 'c1',
  occurrenceId: null,
  workoutId: null,
  workoutName: 'Push',
  date,
  startedAt: 0,
  finishedAt: 1,
  status,
  exercises: [],
  createdAt: 0,
  updatedAt: 0,
});

const kinds = (list: ReturnType<typeof planLocalNotifications>) => list.map(n => `${n.kind}@${n.id.split(':').pop()}`);

const plan = (over: Partial<Parameters<typeof planLocalNotifications>[0]>) =>
  planLocalNotifications({ cycle: null, sessions: [], prefs: defaultNotificationPrefs, todayDate: TODAY, now: MORNING, ...over });

describe('planLocalNotifications', () => {
  it('plans nothing when notifications are off', () => {
    const c = cycle([occ(TODAY, 'Push')]);
    expect(plan({ cycle: c, prefs: { ...defaultNotificationPrefs, enabled: false } })).toEqual([]);
  });

  it('reminds in the morning and nudges in the evening on a scheduled day', () => {
    const c = cycle([occ(TODAY, 'Push'), occ('2026-09-26', null), occ('2026-09-27', 'Pull')]);
    const list = plan({ cycle: c });
    expect(kinds(list)).toEqual([
      `workout_today@${TODAY}`,
      `workout_nudge@${TODAY}`,
      'missed_workout@2026-09-26',
      'workout_today@2026-09-27',
      'workout_nudge@2026-09-27',
      'missed_workout@2026-09-28',
    ]);
    expect(new Date(list[0].fireAt).getHours()).toBe(9);
    expect(new Date(list[1].fireAt).getHours()).toBe(18);
    expect(list[0].title).toContain('Push');
  });

  it('drops reminders whose time has already passed today', () => {
    const c = cycle([occ(TODAY, 'Push')]);
    expect(kinds(plan({ cycle: c, now: EVENING }))).toEqual(['missed_workout@2026-09-26']);
  });

  it('plans nothing for a day once its workout is completed', () => {
    const c = cycle([occ(TODAY, 'Push', 'completed'), occ('2026-09-26', 'Pull')]);
    expect(kinds(plan({ cycle: c, sessions: [session(TODAY)] }))).toEqual([
      'workout_today@2026-09-26',
      'streak_risk@2026-09-26',
      'missed_workout@2026-09-27',
    ]);
  });

  it('skips the evening nudge while a session is in progress', () => {
    const c = cycle([occ(TODAY, 'Push', 'in_progress')]);
    expect(kinds(plan({ cycle: c, sessions: [session(TODAY, 'in_progress')] }))).toEqual([]);
  });

  it('warns about the streak instead of nudging when one is alive', () => {
    const c = cycle([occ('2026-09-24', 'Pull', 'completed'), occ(TODAY, 'Push')]);
    const list = plan({ cycle: c, sessions: [session('2026-09-23'), session('2026-09-24')] });
    const evening = list.find(n => n.kind === 'streak_risk');
    expect(evening?.title).toContain('2');
    expect(`${evening?.title} ${evening?.body}`).toContain('Push');
    expect(list.some(n => n.kind === 'workout_nudge' && n.id.endsWith(TODAY))).toBe(false);
  });

  it('folds the missed workout and today\'s workout into one morning notification', () => {
    const c = cycle([occ('2026-09-24', 'Pull'), occ(TODAY, 'Push')]);
    const list = plan({ cycle: c });
    const morning = list.filter(n => new Date(n.fireAt).getHours() === 9 && n.id.endsWith(TODAY));
    expect(morning).toHaveLength(1);
    expect(morning[0].kind).toBe('missed_workout');
    expect(morning[0].title).toContain('Pull');
    expect(morning[0].body).toContain('Push is up today');
  });

  it('does not nag about workouts missed more than a day ago', () => {
    const c = cycle([occ('2026-09-22', 'Legs'), occ('2026-09-23', null), occ(TODAY, null)]);
    expect(kinds(plan({ cycle: c }))).toEqual([]);
  });

  it('announces a plan the evening before it starts', () => {
    const c = cycle([occ('2026-09-28', 'Push')]);
    const list = plan({ cycle: c });
    expect(list[0].kind).toBe('plan_starts');
    expect(list[0].body).toContain('Push');
    expect(new Date(list[0].fireAt).getDate()).toBe(27);
  });

  it('announces the cycle summary the morning after it ends', () => {
    const c = cycle([occ('2026-09-24', 'Push', 'completed'), occ(TODAY, 'Pull', 'completed')], { endDate: TODAY });
    const list = plan({ cycle: c, now: EVENING, sessions: [session(TODAY)] });
    expect(list.map(n => n.kind)).toEqual(['cycle_finished']);
    expect(list[0].target).toEqual({ screen: 'cycle_summary', cycleId: 'c1' });
    expect(list[0].title).toContain('2');
  });

  it('ignores a completed cycle', () => {
    const c = cycle([occ(TODAY, 'Push')], { status: 'completed' });
    expect(plan({ cycle: c })).toEqual([]);
  });

  it('adds a weekly weigh-in when enabled, skipping a day already logged', () => {
    const prefs = { ...defaultNotificationPrefs, weighIn: true, weighInWeekday: 5 as const };
    expect(kinds(plan({ prefs }))).toEqual([`weigh_in@${TODAY}`, 'weigh_in@2026-10-02']);
    expect(kinds(plan({ prefs, lastWeighInDate: TODAY }))).toEqual(['weigh_in@2026-10-02']);
  });

  it('keeps every id unique and sorted by time', () => {
    const c = cycle(['2026-09-25', '2026-09-26', '2026-09-27', '2026-09-28'].map(d => occ(d, 'Full')));
    const list = plan({ cycle: c, prefs: { ...defaultNotificationPrefs, weighIn: true } });
    expect(new Set(list.map(n => n.id)).size).toBe(list.length);
    expect([...list].sort((a, b) => a.fireAt - b.fireAt)).toEqual(list);
  });
});

describe('prefs and rest timer', () => {
  it('fills in defaults for profiles saved before a key existed', () => {
    expect(withPrefDefaults(null)).toEqual(defaultNotificationPrefs);
    expect(withPrefDefaults({ weighIn: true })).toMatchObject({ weighIn: true, enabled: true, morningTime: { hour: 9, minute: 0 } });
  });

  it('fires the rest-over notification when the rest ends', () => {
    const n = planRestOverNotification(1_000, 90, 's1', 'Bench press');
    expect(n).toMatchObject({ fireAt: 91_000, target: { screen: 'session', sessionId: 's1' } });
    expect(n.body).toContain('Bench press');
  });
});

describe('notification copy variants', () => {
  it('varies the evening nudge across days but keeps it stable for one day', () => {
    const c = cycle(Array.from({ length: 10 }, (_, i) => occ(`2026-09-${String(25 + i).padStart(2, '0')}`.replace('2026-09-31', '2026-10-01').replace('2026-09-32', '2026-10-02').replace('2026-09-33', '2026-10-03').replace('2026-09-34', '2026-10-04'), 'Push')));
    const nudges = plan({ cycle: c }).filter(n => n.kind === 'workout_nudge');
    expect(new Set(nudges.map(n => n.title)).size).toBeGreaterThan(1);
    expect(nudges.every(n => `${n.title} ${n.body}`.includes('Push'))).toBe(true);
    const again = plan({ cycle: c }).filter(n => n.kind === 'workout_nudge');
    expect(again.map(n => n.title)).toEqual(nudges.map(n => n.title));
  });

  it('names the next exercise in every rest-over variant', () => {
    for (let t = 0; t < 8; t++) {
      const n = planRestOverNotification(t * 1000, 90, 's1', 'Bench Press');
      expect(`${n.title} ${n.body}`).toContain('Bench Press');
    }
  });
});
