import { Cycle, Plan, Session, Workout } from '../../../data/models';
import { SessionResult } from '../../../data/services/workoutService';
import { ExerciseKind } from '../../../data/catalog/exerciseKinds';

/**
 * The running workout's screens. They live in the root stack, above the
 * tabs, so a workout in progress covers the tab bar: it is a focus mode,
 * and the back button is the way out. Any screen can navigate to them;
 * the name bubbles up to the root.
 */
export type SessionRoutes = {
  /** Plan and cycle are null for a quick workout; `activePlan` then offers its workouts to copy in. */
  SessionScreen: { plan: Plan | null; cycle: Cycle | null; session: Session; activePlan?: { plan: Plan; cycle: Cycle | null } };
  SessionCompleteScreen: { result: SessionResult };
  /** The running workout's exercise list, as a modal over the session; reads the session through sessionChannel. */
  SessionExercisesScreen: { workoutName: string; currentIndex: number; /** The workout's kind, so Add exercise only offers it (v1 #10). */ kind?: ExerciseKind };
  /** Quick workout's first step: what kind it is (v1 #10). `activePlan` passes on to the session. */
  QuickWorkoutKindScreen: { activePlan?: { plan: Plan; cycle: Cycle | null } } | undefined;
  /** The active plan's workouts to copy into an empty quick workout, as a modal over the picker. */
  ActivePlanWorkoutsScreen: { workouts: Workout[] };
  /**
   * The one exercise picker, in session mode (an extra exercise for the
   * running session) or swap mode (a stand-in for one of its exercises);
   * the pick comes back through swapChannel.
   */
  ExercisePickerScreen:
    | { mode: 'session'; excludeIds: string[]; planWorkouts?: Workout[]; sessionExerciseId?: undefined; exerciseId?: undefined; workoutId?: undefined; kind?: ExerciseKind }
    | { mode: 'swap'; sessionExerciseId: string; exerciseId: string; excludeIds: string[]; planWorkouts?: undefined; workoutId?: undefined; kind?: ExerciseKind }
    /** The plan editor: add to this workout of the draft. */
    | { workoutId: string; mode?: undefined; excludeIds?: undefined; planWorkouts?: undefined; sessionExerciseId?: undefined; exerciseId?: undefined };
};
