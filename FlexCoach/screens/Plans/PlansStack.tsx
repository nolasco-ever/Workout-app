import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { generalIcons } from '../../components/icons/icon-library';
import { HeaderButton } from '../../components/headers/HeaderButton';
import { useStackOptions } from '../../navigation/stackOptions';
import { PlanEditorProvider } from './PlanEditorContext';
import { PlansScreen } from './screens/PlansScreen';
import { PlanOverviewScreen } from './screens/PlanOverviewScreen';
import { PlanBasicsScreen } from './screens/PlanBasicsScreen';
import { PlanWorkoutsScreen } from './screens/PlanWorkoutsScreen';
import { WorkoutEditorScreen } from './screens/WorkoutEditorScreen';
import { ExercisePickerScreen } from './screens/ExercisePickerScreen';
import { ExerciseEntryScreen } from './screens/ExerciseEntryScreen';
import { PlanScheduleScreen } from './screens/PlanScheduleScreen';
import { PlanReviewScreen } from './screens/PlanReviewScreen';
import { PlanEditScreen } from './screens/PlanEditScreen';
import { ExerciseDetailScreen } from '../Tabs/Workout/screens/ExerciseDetailScreen';

export type EditorMode = 'create' | 'edit';

export type PlansStackParams = {
  PlansScreen: undefined;
  PlanOverviewScreen: { planId: string };
  /** The edit hub: the plan's sections to tap into, and Save. Starts the editor on `planId` if needed. */
  PlanEditScreen: { planId: string };
  PlanBasicsScreen: { mode: EditorMode };
  PlanWorkoutsScreen: { mode: EditorMode };
  WorkoutEditorScreen: { workoutId: string };
  ExercisePickerScreen: { workoutId: string };
  ExerciseEntryScreen: { workoutId: string; entryId: string };
  PlanScheduleScreen: { mode: EditorMode };
  PlanReviewScreen: { mode: EditorMode };
  ExerciseDetailScreen: { exerciseId: string; addToWorkoutId?: string; addToSession?: boolean; swapForSessionExerciseId?: string };
};

const Stack = createNativeStackNavigator<PlansStackParams>();

export const PlansStack = () => {
  const opts = useStackOptions();
  const close = (navigation: { goBack: () => void }) => () => <HeaderButton icon={generalIcons.xMark} accessibilityLabel="Close" onPress={() => navigation.goBack()} />;
  // Creating walks four numbered steps; editing opens one section at a time from the hub, so no step numbers then.
  const step = (n: number, title: string) => ({ route }: { route: { params?: { mode?: EditorMode } } }) => opts.screen(route.params?.mode === 'edit' ? title : `${title}  ·  ${n} of 4`);

  return (
    <PlanEditorProvider>
      <Stack.Navigator screenOptions={opts.base}>
        <Stack.Screen name="PlansScreen" component={PlansScreen} options={({ navigation }) => ({ ...opts.root('My plans'), headerLeft: close(navigation) })} />
        <Stack.Screen name="PlanOverviewScreen" component={PlanOverviewScreen} options={opts.screen('Plan')} />
        {/* From the cycle review the hub is the modal's first screen, so it gets a close button instead of a back one. */}
        <Stack.Screen name="PlanEditScreen" component={PlanEditScreen} options={({ navigation, route }) => ({ ...opts.screen('Edit plan'), ...(navigation.getState().routes[0]?.key === route.key ? { headerLeft: close(navigation) } : {}) })} />
        <Stack.Screen name="PlanBasicsScreen" component={PlanBasicsScreen} options={step(1, 'Basics')} />
        <Stack.Screen name="PlanWorkoutsScreen" component={PlanWorkoutsScreen} options={step(2, 'Workouts')} />
        <Stack.Screen name="WorkoutEditorScreen" component={WorkoutEditorScreen} options={opts.screen('Workout')} />
        <Stack.Screen name="ExercisePickerScreen" component={ExercisePickerScreen} options={({ navigation }) => opts.modal('Add exercise', close(navigation))} />
        <Stack.Screen name="ExerciseEntryScreen" component={ExerciseEntryScreen} options={({ navigation }) => opts.modal('Exercise', close(navigation))} />
        <Stack.Screen name="PlanScheduleScreen" component={PlanScheduleScreen} options={step(3, 'Schedule')} />
        <Stack.Screen name="PlanReviewScreen" component={PlanReviewScreen} options={step(4, 'Review')} />
        <Stack.Screen name="ExerciseDetailScreen" component={ExerciseDetailScreen} options={({ navigation }) => opts.modal('How to', close(navigation))} />
      </Stack.Navigator>
    </PlanEditorProvider>
  );
};
