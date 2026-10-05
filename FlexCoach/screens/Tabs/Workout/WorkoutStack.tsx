import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Cycle, Occurrence, Plan, Session, Workout } from '../../../data/models';
import { SessionResult } from '../../../data/services/workoutService';
import { generalIcons } from '../../../components/icons/icon-library';
import { HeaderButton } from '../../../components/headers/HeaderButton';
import { useStackOptions } from '../../../navigation/stackOptions';
import { WorkoutHomeScreen } from './screens/WorkoutHomeScreen';
import { WorkoutPreviewScreen } from './screens/WorkoutPreviewScreen';
import { SessionScreen } from './screens/SessionScreen';
import { SessionCompleteScreen } from './screens/SessionCompleteScreen';
import { CycleReviewScreen } from './screens/CycleReviewScreen';
import { ExerciseDetailScreen } from './screens/ExerciseDetailScreen';
import { SessionDetailScreen } from './screens/SessionDetailScreen';
import { ExercisePickerScreen } from '../../Plans/screens/ExercisePickerScreen';
import { SessionExercisesScreen } from './screens/SessionExercisesScreen';
import { ActivePlanWorkoutsScreen } from './screens/ActivePlanWorkoutsScreen';

export type WorkoutStackParams = {
  WorkoutHomeScreen: undefined;
  WorkoutPreviewScreen: { plan: Plan; cycle: Cycle; occurrence: Occurrence };
  /** Plan and cycle are null for a quick workout; `activePlan` then offers its workouts to copy in. */
  SessionScreen: { plan: Plan | null; cycle: Cycle | null; session: Session; activePlan?: { plan: Plan; cycle: Cycle | null } };
  SessionCompleteScreen: { result: SessionResult };
  /** Either the live objects, or just an id (from a notification or the feed). */
  CycleReviewScreen: { plan: Plan; cycle: Cycle; cycleId?: undefined } | { cycleId: string; plan?: undefined; cycle?: undefined };
  SessionDetailScreen: { sessionId: string; workoutName?: string };
  ExerciseDetailScreen: { exerciseId: string };
  /** The running workout's exercise list, as a modal over the session; reads the session through sessionChannel. */
  SessionExercisesScreen: { workoutName: string; currentIndex: number };
  /** The active plan's workouts to copy into an empty quick workout, as a modal over the picker. */
  ActivePlanWorkoutsScreen: { workouts: Workout[] };
  /**
   * The one exercise picker, in session mode (an extra exercise for the
   * running session) or swap mode (a stand-in for one of its exercises);
   * the pick comes back through swapChannel.
   */
  ExercisePickerScreen: { mode: 'session'; excludeIds: string[]; planWorkouts?: Workout[]; sessionExerciseId?: undefined; exerciseId?: undefined } | { mode: 'swap'; sessionExerciseId: string; exerciseId: string; excludeIds: string[]; planWorkouts?: undefined };
};

const Stack = createNativeStackNavigator<WorkoutStackParams>();

export const WorkoutStack = () => {
  const opts = useStackOptions();
  return (
    <Stack.Navigator screenOptions={opts.base}>
      <Stack.Screen name="WorkoutHomeScreen" component={WorkoutHomeScreen} options={opts.tabRoot('Workout')} />
      <Stack.Screen name="WorkoutPreviewScreen" component={WorkoutPreviewScreen} options={({ route }) => opts.screen(route.params.occurrence.workoutName ?? 'Workout')} />
      {/* Draws its own header row (see SessionScreen) so the title stays centred beside the rest pill. */}
      <Stack.Screen name="SessionScreen" component={SessionScreen} options={({ route }) => ({ ...opts.screen(route.params.session.workoutName), headerShown: false, gestureEnabled: false })} />
      {/* A plain push, not a modal: popping a modal presented over the tab bar left the Workout home rendered as a sheet with no tabs. */}
      <Stack.Screen name="SessionCompleteScreen" component={SessionCompleteScreen} options={{ ...opts.base, headerShown: false, animation: 'fade', gestureEnabled: false }} />
      <Stack.Screen name="CycleReviewScreen" component={CycleReviewScreen} options={opts.screen('Cycle review')} />
      {/* The title comes from the route so the header doesn't flash "Workout" before the session loads. */}
      <Stack.Screen name="SessionDetailScreen" component={SessionDetailScreen} options={({ route }) => opts.screen(route.params.workoutName ?? 'Workout')} />
      <Stack.Screen name="ExerciseDetailScreen" component={ExerciseDetailScreen} options={({ navigation }) => opts.modal('How to', () => <HeaderButton icon={generalIcons.xMark} accessibilityLabel="Close" onPress={() => navigation.goBack()} />)} />
      <Stack.Screen name="SessionExercisesScreen" component={SessionExercisesScreen} options={({ navigation, route }) => opts.modal(route.params.workoutName, () => <HeaderButton icon={generalIcons.xMark} accessibilityLabel="Close" onPress={() => navigation.goBack()} />)} />
      <Stack.Screen name="ActivePlanWorkoutsScreen" component={ActivePlanWorkoutsScreen} options={({ navigation }) => opts.modal('Active plan workouts', () => <HeaderButton icon={generalIcons.xMark} accessibilityLabel="Close" onPress={() => navigation.goBack()} />)} />
      <Stack.Screen name="ExercisePickerScreen" component={ExercisePickerScreen} options={({ navigation, route }) => opts.modal(route.params.mode === 'swap' ? 'Swap exercise' : 'Add exercise', () => <HeaderButton icon={generalIcons.xMark} accessibilityLabel="Close" onPress={() => navigation.goBack()} />)} />
    </Stack.Navigator>
  );
};
