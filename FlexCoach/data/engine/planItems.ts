import { Plan, Workout } from '../models';

/**
 * A plan's items (v1 #10): strength and stretching workouts, and cardio items,
 * which are one cardio exercise added on their own (a workout of type 'cardio').
 */
export const isCardioItem = (w: Pick<Workout, 'type'>): boolean => w.type === 'cardio';

/** "3 workouts · 1 cardio", "2 workouts", "1 cardio": what a plan holds, in a line (owner, 2026-11-07). */
export const planItemsLabel = (plan: Pick<Plan, 'workouts'>): string => {
  const cardio = plan.workouts.filter(isCardioItem).length;
  const workouts = plan.workouts.length - cardio;
  const parts = [workouts > 0 || cardio === 0 ? `${workouts} workout${workouts === 1 ? '' : 's'}` : null, cardio > 0 ? `${cardio} cardio` : null];
  return parts.filter(Boolean).join(' · ');
};

/** "Push", "Push and Run", "Push, Run and Yoga": a day's items in a line. */
export const joinNames = (names: string[]): string => (names.length <= 1 ? names.join('') : `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`);
