import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Cycle, Occurrence, Plan } from '../../../data/models';
import { generalIcons } from '../../../components/icons/icon-library';
import { HeaderButton } from '../../../components/headers/HeaderButton';
import { useStackOptions } from '../../../navigation/stackOptions';
import { WorkoutHomeScreen } from './screens/WorkoutHomeScreen';
import { WorkoutPreviewScreen } from './screens/WorkoutPreviewScreen';
import { ExerciseDetailScreen } from './screens/ExerciseDetailScreen';
import { SessionDetailScreen } from './screens/SessionDetailScreen';
import type { SessionRoutes } from './sessionRoutes';
import type { LegacySwapRoutes } from './screens/LegacySwap';

/** The tab's own screens; the running workout's screens (SessionRoutes) and Legacy Swap's sit in the root stack, over the tabs, and are reachable from here by name. */
export type WorkoutStackParams = SessionRoutes & LegacySwapRoutes & {
  WorkoutHomeScreen: undefined;
  WorkoutPreviewScreen: { plan: Plan; cycle: Cycle; occurrence: Occurrence };
  /** Either the live objects, or just an id (from a notification or the feed). */
  SessionDetailScreen: { sessionId: string; workoutName?: string };
  /** The how-to from the preview; the root stack has its own for the running workout. */
  ExerciseDetailScreen: { exerciseId: string; knownAs?: string };
};

const Stack = createNativeStackNavigator<WorkoutStackParams>();

export const WorkoutStack = () => {
  const opts = useStackOptions();
  return (
    <Stack.Navigator screenOptions={opts.base}>
      <Stack.Screen name="WorkoutHomeScreen" component={WorkoutHomeScreen} options={opts.tabRoot('Workout')} />
      <Stack.Screen name="WorkoutPreviewScreen" component={WorkoutPreviewScreen} options={({ route }) => opts.screen(route.params.occurrence.workoutName ?? 'Workout')} />
      {/* The title comes from the route so the header doesn't flash "Workout" before the session loads. */}
      <Stack.Screen name="SessionDetailScreen" component={SessionDetailScreen} options={({ route }) => opts.screen(route.params.workoutName ?? 'Workout')} />
      <Stack.Screen name="ExerciseDetailScreen" component={ExerciseDetailScreen} options={({ navigation }) => opts.modal('How to', () => <HeaderButton icon={generalIcons.xMark} accessibilityLabel="Close" onPress={() => navigation.goBack()} />)} />
    </Stack.Navigator>
  );
};
