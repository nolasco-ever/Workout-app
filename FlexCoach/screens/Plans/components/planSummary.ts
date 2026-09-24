import { MuscleGroup, Plan, WorkoutExercise } from '../../../data/models';
import { getCatalogExercise } from '../../../data/catalog/exerciseCatalog';
import { formatDistance, formatDuration, formatWeight } from '../../../data/engine/units';

const DAY = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export const workoutName = (plan: Plan, id: string | null): string => (id ? plan.workouts.find(w => w.id === id)?.name ?? 'Untitled' : 'Rest');

export const describeSchedule = (plan: Plan): string => {
  const s = plan.schedule;
  if (s.mode === 'rotation') {
    if (s.slots.length === 0) return 'No schedule yet';
    const seq = s.slots.map(id => workoutName(plan, id)).join(' · ');
    return `${seq}${s.passesPerCycle > 1 ? ` · ${s.passesPerCycle}× per cycle` : ''}`;
  }
  const days = s.weekdays.map((id, i) => (id ? `${DAY[i]} ${workoutName(plan, id)}` : null)).filter(Boolean);
  if (days.length === 0) return 'No schedule yet';
  return `${days.join(', ')} · ${s.weeksPerCycle}-week cycle${s.weeksPerCycle > 1 ? 's' : ''}`;
};

export const cycleLengthDays = (plan: Plan): number =>
  plan.schedule.mode === 'rotation' ? plan.schedule.slots.length * plan.schedule.passesPerCycle : 7 * plan.schedule.weeksPerCycle;

/** Primary and secondary muscles hit anywhere in the plan. */
export const muscleCoverage = (plan: Plan): { primary: MuscleGroup[]; secondary: MuscleGroup[] } => {
  const primary = new Set<MuscleGroup>();
  const secondary = new Set<MuscleGroup>();
  for (const w of plan.workouts) {
    for (const e of w.exercises) {
      const ex = getCatalogExercise(e.exerciseId);
      ex?.primaryMuscles.forEach(m => primary.add(m));
      ex?.secondaryMuscles.forEach(m => secondary.add(m));
    }
  }
  return { primary: [...primary], secondary: [...secondary].filter(m => !primary.has(m)) };
};

export const GOAL_LABEL = { strength: 'Strength', hypertrophy: 'Build muscle', endurance: 'Endurance' } as const;

/** One line for an exercise prescription, e.g. "3 × 8–12 @ 50 lb". */
export const describeEntry = (e: WorkoutExercise, unit: 'kg' | 'lb', dist: 'km' | 'mi'): string => {
  const w = e.startingWeightKg !== null ? ` @ ${formatWeight(e.startingWeightKg, unit)}` : '';
  switch (e.measurement) {
    case 'weight_reps':
      return `${e.sets} × ${e.repRangeMin}–${e.repRangeMax}${w}`;
    case 'reps':
      return `${e.sets} × ${e.repRangeMin}–${e.repRangeMax}${e.startingWeightKg ? ` +${formatWeight(e.startingWeightKg, unit)}` : ' bodyweight'}`;
    case 'time':
      return `${e.sets} × ${formatDuration(e.startingDurationSec)}${w}`;
    case 'distance_time':
      return `${formatDistance(e.startingDistanceM, dist)} in ${formatDuration(e.startingDurationSec)}`;
  }
};
