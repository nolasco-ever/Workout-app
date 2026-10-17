export type EditorMode = 'create' | 'edit';

/** The plan screens' routes. They live in the root stack beside everything else (they were a stack of their own once), pushed like any screen. */
export type PlansStackParams = {
  PlansScreen: undefined;
  PlanOverviewScreen: { planId: string };
  /** The edit hub: the plan's sections to tap into, and Save. Starts the editor on `planId` if needed. */
  PlanEditScreen: { planId: string };
  PlanBasicsScreen: { mode: EditorMode };
  PlanWorkoutsScreen: { mode: EditorMode };
  WorkoutEditorScreen: { workoutId: string; /** An exercise to open with it: a rotation closed its sheet. */ entryId?: string };
  ExercisePickerScreen: { workoutId: string };
  ExerciseEntryScreen: { workoutId: string; entryId: string };
  PlanScheduleScreen: { mode: EditorMode };
  PlanReviewScreen: { mode: EditorMode };
  ExerciseDetailScreen: { exerciseId: string; knownAs?: string; addToWorkoutId?: string; addToSession?: boolean; swapForSessionExerciseId?: string };
};

import { StackActions } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

type PlansNavigation = Pick<NativeStackNavigationProp<PlansStackParams>, 'getState' | 'dispatch' | 'popTo'>;

/** The editor's screens: a phone pushes them one on another (hub, step, workout, exercise); a wide window shows them all as one workspace. */
const EDITOR_SCREENS = new Set<string>(['PlanEditScreen', 'PlanBasicsScreen', 'PlanWorkoutsScreen', 'PlanScheduleScreen', 'PlanReviewScreen', 'WorkoutEditorScreen', 'ExerciseEntryScreen']);

/**
 * Out of the editor in one step, to whatever opened it (the plan's page,
 * the cycle review, a buddy's plan). A phone can have stacked several
 * editor screens that a rotation then draws as one workspace each; leaving
 * pops the whole run, not one of them.
 */
export const leaveEditor = (navigation: PlansNavigation): void => {
  const routes = navigation.getState().routes;
  let count = 0;
  for (let i = routes.length - 1; i > 0 && EDITOR_SCREENS.has(routes[i].name); i--) count++;
  navigation.dispatch(StackActions.pop(Math.max(count, 1)));
};

/**
 * Where the plan screens go when they are done: back to the plans list if
 * it is in the stack (the usual way in), else out of the editor to
 * whatever pushed it (the cycle review's Adjust plan, a buddy's plan).
 */
export const leavePlans = (navigation: PlansNavigation): void => {
  if (navigation.getState().routes.some(r => r.name === 'PlansScreen')) navigation.popTo('PlansScreen');
  else leaveEditor(navigation);
};
