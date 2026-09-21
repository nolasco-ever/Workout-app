import { MuscleGroup, Plan } from '../../../data/models';
import { getCatalogExercise } from '../../../data/catalog/exerciseCatalog';

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
