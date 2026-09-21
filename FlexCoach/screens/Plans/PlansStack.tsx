import React from 'react';
import { createStackNavigator, TransitionPresets } from '@react-navigation/stack';
import { useTheme } from '../../theme';
import { Icon } from '../../components/icons/Icon';
import { directionIcons, generalIcons } from '../../components/icons/icon-library';
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
import { ExerciseDetailScreen } from '../Tabs/Workout/screens/ExerciseDetailScreen';

export type EditorMode = 'create' | 'edit';

export type PlansStackParams = {
  PlansScreen: undefined;
  PlanOverviewScreen: { planId: string };
  PlanBasicsScreen: { mode: EditorMode };
  PlanWorkoutsScreen: { mode: EditorMode };
  WorkoutEditorScreen: { workoutId: string };
  ExercisePickerScreen: { workoutId: string };
  ExerciseEntryScreen: { workoutId: string; entryId: string };
  PlanScheduleScreen: { mode: EditorMode };
  PlanReviewScreen: { mode: EditorMode };
  ExerciseDetailScreen: { exerciseId: string; addToWorkoutId?: string };
};

const Stack = createStackNavigator<PlansStackParams>();

export const PlansStack = () => {
  const { colors, fonts } = useTheme();
  const back = () => <Icon icon={directionIcons.angleLeft} color={colors.ink} size={26} style={{ marginLeft: 10 }} />;
  const close = () => <Icon icon={generalIcons.xMark} color={colors.ink} size={24} style={{ marginLeft: 10 }} />;
  const header = (title: string) => ({
    headerShown: true,
    headerStyle: { backgroundColor: colors.ground, shadowColor: colors.transparent },
    headerTitleStyle: { color: colors.ink, fontFamily: fonts.display.semibold, fontSize: 17 },
    headerTitle: title,
    headerBackTitle: '',
    headerTintColor: colors.ink,
    headerBackImage: back,
  });
  const step = (n: number, title: string) => header(`${title}  ·  ${n} of 4`);

  return (
    <PlanEditorProvider>
      <Stack.Navigator>
        <Stack.Screen name="PlansScreen" component={PlansScreen} options={{ ...header('My plans'), headerBackImage: close }} />
        <Stack.Screen name="PlanOverviewScreen" component={PlanOverviewScreen} options={header('Plan')} />
        <Stack.Screen name="PlanBasicsScreen" component={PlanBasicsScreen} options={step(1, 'Basics')} />
        <Stack.Screen name="PlanWorkoutsScreen" component={PlanWorkoutsScreen} options={step(2, 'Workouts')} />
        <Stack.Screen name="WorkoutEditorScreen" component={WorkoutEditorScreen} options={header('Workout')} />
        <Stack.Screen name="ExercisePickerScreen" component={ExercisePickerScreen} options={{ ...header('Add exercise'), headerBackImage: close, ...TransitionPresets.ModalSlideFromBottomIOS }} />
        <Stack.Screen name="ExerciseEntryScreen" component={ExerciseEntryScreen} options={{ ...header('Exercise'), headerBackImage: close, ...TransitionPresets.ModalSlideFromBottomIOS }} />
        <Stack.Screen name="PlanScheduleScreen" component={PlanScheduleScreen} options={step(3, 'Schedule')} />
        <Stack.Screen name="PlanReviewScreen" component={PlanReviewScreen} options={step(4, 'Review')} />
        <Stack.Screen name="ExerciseDetailScreen" component={ExerciseDetailScreen} options={{ ...header('How to'), headerBackImage: close, ...TransitionPresets.ModalSlideFromBottomIOS }} />
      </Stack.Navigator>
    </PlanEditorProvider>
  );
};
