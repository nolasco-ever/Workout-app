import React from 'react';
import { createStackNavigator, TransitionPresets } from '@react-navigation/stack';
import { Cycle, Occurrence, Plan, Session } from '../../../data/models';
import { SessionResult } from '../../../data/services/workoutService';
import { useTheme } from '../../../theme';
import { Icon } from '../../../components/icons/Icon';
import { directionIcons, generalIcons } from '../../../components/icons/icon-library';
import { NavigationHeader } from '../../../components/headers/NavigationHeader';
import { WorkoutHomeScreen } from './screens/WorkoutHomeScreen';
import { WorkoutPreviewScreen } from './screens/WorkoutPreviewScreen';
import { SessionScreen } from './screens/SessionScreen';
import { SessionCompleteScreen } from './screens/SessionCompleteScreen';
import { CycleReviewScreen } from './screens/CycleReviewScreen';
import { ExerciseDetailScreen } from './screens/ExerciseDetailScreen';

export type WorkoutStackParams = {
  WorkoutHomeScreen: undefined;
  WorkoutPreviewScreen: { plan: Plan; cycle: Cycle; occurrence: Occurrence };
  SessionScreen: { plan: Plan; cycle: Cycle; session: Session };
  SessionCompleteScreen: { result: SessionResult };
  CycleReviewScreen: { plan: Plan; cycle: Cycle };
  ExerciseDetailScreen: { exerciseId: string };
};

const Stack = createStackNavigator<WorkoutStackParams>();

export const WorkoutStack = () => {
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
  });

  return (
    <Stack.Navigator>
      <Stack.Screen name="WorkoutHomeScreen" component={WorkoutHomeScreen} options={{ header: () => <NavigationHeader title="Workout" /> }} />
      <Stack.Screen
        name="WorkoutPreviewScreen"
        component={WorkoutPreviewScreen}
        options={({ route }) => ({ ...header(route.params.occurrence.workoutName ?? 'Workout'), headerBackImage: back })}
      />
      <Stack.Screen
        name="SessionScreen"
        component={SessionScreen}
        options={({ route }) => ({ ...header(route.params.session.workoutName), headerBackImage: back, gestureEnabled: false })}
      />
      <Stack.Screen
        name="SessionCompleteScreen"
        component={SessionCompleteScreen}
        options={{ headerShown: false, gestureEnabled: false, ...TransitionPresets.ModalSlideFromBottomIOS }}
      />
      <Stack.Screen name="CycleReviewScreen" component={CycleReviewScreen} options={{ ...header('Cycle review'), headerBackImage: back }} />
      <Stack.Screen
        name="ExerciseDetailScreen"
        component={ExerciseDetailScreen}
        options={{ ...header('How to'), headerBackImage: close, ...TransitionPresets.ModalSlideFromBottomIOS }}
      />
    </Stack.Navigator>
  );
};
