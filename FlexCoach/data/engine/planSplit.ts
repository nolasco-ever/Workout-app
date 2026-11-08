import { ExerciseKind, Id, Plan, ScheduleDay, SplitMove, Workout, WorkoutExercise } from '../models';

export type { SplitMove };
import { mapScheduleDays } from './scheduleDays';
import { joinNames } from './planItems';
import { NoticeContent, NoticeText } from './notices';

/**
 * Splitting a plan made before workouts had kinds (v1 #10.11, owner
 * 2026-11-07): cardio leaves its workout and becomes cardio items on the
 * same days; stretches in a strength workout become one stretching workout
 * of their own. Each piece goes before the workout if it came before every
 * strength exercise in it, after otherwise. A workout of only cardio becomes
 * its cardio items, in its place. Timed drills count as strength and stay.
 * Targets go with their exercise. Every workout ends up typed.
 */

export interface PlanSplit {
  plan: Plan;
  moves: SplitMove[];
}

const reorder = (entries: WorkoutExercise[]): WorkoutExercise[] => entries.map((e, i) => ({ ...e, order: i }));

/** The split plan and what moved; the plan comes back unchanged (same object) when there is nothing to do. */
export const splitPlan = (plan: Plan, kindOf: (entry: WorkoutExercise) => ExerciseKind, newId: () => Id): PlanSplit => {
  const moves: SplitMove[] = [];
  const workouts: Workout[] = [];
  /** What each old workout id now stands for on a schedule day, in order. */
  const replace = new Map<Id, Id[]>();
  let changed = false;

  for (const w of [...plan.workouts].sort((a, b) => a.order - b.order)) {
    if (w.type === 'cardio') {
      workouts.push(w);
      continue;
    }
    const entries = [...w.exercises].sort((a, b) => a.order - b.order);
    const kinds = entries.map(kindOf);
    const firstStrength = kinds.indexOf('strength');
    const strength = entries.filter((_, i) => kinds[i] === 'strength');
    const stretches = entries.filter((_, i) => kinds[i] === 'stretching');
    const cardio = entries.filter((_, i) => kinds[i] === 'cardio');
    const leads = (i: number) => firstStrength === -1 || i < firstStrength;

    // Only stretches, or only strength: nothing moves, the workout just gets its kind.
    if (cardio.length === 0 && (strength.length === 0 || stretches.length === 0)) {
      const type = strength.length === 0 && stretches.length > 0 ? 'stretching' : 'strength';
      if (w.type !== type) changed = true;
      workouts.push(w.type === type ? w : { ...w, type });
      continue;
    }
    changed = true;
    const before: Id[] = [];
    const after: Id[] = [];
    // The workout stays when it still holds strength, or holds the stretches when there is no strength left.
    const keepsWorkout = strength.length > 0 || stretches.length > 0;
    const stays: Workout | null = keepsWorkout
      ? { ...w, type: strength.length > 0 ? 'strength' : 'stretching', exercises: reorder(strength.length > 0 ? strength : stretches) }
      : null;

    if (strength.length > 0 && stretches.length > 0) {
      const item: Workout = { id: newId(), name: `${w.name} stretches`, order: 0, type: 'stretching', exercises: reorder(stretches) };
      workouts.push(item);
      const place = leads(entries.indexOf(stretches[0])) ? 'before' : 'after';
      (place === 'before' ? before : after).push(item.id);
      moves.push({ kind: 'stretching', name: item.name, from: w.name, place, id: item.id, days: [] });
    }
    entries.forEach((e, i) => {
      if (kinds[i] !== 'cardio') return;
      const item: Workout = { id: newId(), name: e.exerciseName, order: 0, type: 'cardio', exercises: [{ ...e, order: 0 }] };
      workouts.push(item);
      const place = !stays ? 'instead' : leads(i) ? 'before' : 'after';
      (place === 'after' ? after : before).push(item.id);
      moves.push({ kind: 'cardio', name: item.name, from: w.name, place, id: item.id, days: [] });
    });
    if (stays) workouts.push(stays);
    replace.set(w.id, [...before, ...(stays ? [w.id] : []), ...after]);
  }

  if (!changed) return { plan, moves };
  // The old order first, each piece right after the workout it came from.
  const ordered: Workout[] = [];
  for (const w of [...plan.workouts].sort((a, b) => a.order - b.order)) {
    const ids = replace.get(w.id) ?? [w.id];
    for (const id of ids) {
      const found = workouts.find(x => x.id === id);
      if (found && !ordered.includes(found)) ordered.push(found);
    }
  }
  for (const w of workouts) if (!ordered.includes(w)) ordered.push(w);
  const schedule = mapScheduleDays(plan.schedule, (day: ScheduleDay) => day.flatMap(id => replace.get(id) ?? [id]));
  const next: Plan = { ...plan, workouts: ordered.map((w, i) => ({ ...w, order: i })), schedule };
  return { plan: next, moves: moves.map(m => ({ ...m, days: daysOf(next, m.id) })) };
};

/** Where an item sits, as the Notice says it: the days its workout is on, "Mon and Thu" or "Day 2 and Day 4". */
export const daysOf = (plan: Plan, workoutId: Id): string[] => {
  const WEEKDAY = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return plan.schedule.mode === 'weekly'
    ? plan.schedule.weekdays.flatMap((day, i) => (day.includes(workoutId) ? [WEEKDAY[i]] : []))
    : plan.schedule.slots.flatMap((day, i) => (day.includes(workoutId) ? [`Day ${i + 1}`] : []));
};

const placeText = (m: SplitMove): string => {
  if (m.place === 'instead') return `in place of ${m.from}`;
  const where = `${m.place} ${m.from}`;
  if (m.kind === 'stretching') return `${where} on the same days`;
  return m.days.length ? `${where} on ${joinNames(m.days)}` : where;
};

/** The plan split Notice (v1 #10.11, the "Notice" board): what moved in each plan that was split; null when nothing moved. */
export const splitNotice = (plans: Pick<Plan, 'name' | 'split'>[]): NoticeContent | null => {
  const moved = plans.filter(p => p.split && p.split.moves.length > 0);
  if (!moved.length) return null;
  const several = moved.length > 1;
  const items: NoticeText[] = moved.flatMap(p =>
    p.split!.moves.map((m): NoticeText => [
      { bold: m.name },
      `${m.kind === 'cardio' ? ' is now its own cardio, ' : ' is a stretching workout of its own, '}${placeText(m)}.${several ? ` (${p.name})` : ''}`,
    ]),
  );
  return {
    intro: `Cardio and stretching exercises now sit apart from strength exercises. ${several ? 'We moved:' : `In ${moved[0].name} we moved:`}`,
    items,
    footnote: 'Your history, records and targets are unchanged. Days already done this cycle stay as they are.',
  };
};
