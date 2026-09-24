import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import { Cycle, Occurrence, Plan, Session } from '../../../data/models';
import { SessionResult } from '../../../data/services/workoutService';
import { generalIcons } from '../../../components/icons/icon-library';
import { HeaderButton } from '../../../components/headers/HeaderButton';
import { useStackOptions } from '../../../navigation/stackOptions';
import { AppStackParams } from '../../../appNavigators/AppStack';
import { WorkoutHomeScreen } from './screens/WorkoutHomeScreen';
import { WorkoutPreviewScreen } from './screens/WorkoutPreviewScreen';
import { SessionScreen } from './screens/SessionScreen';
import { SessionCompleteScreen } from './screens/SessionCompleteScreen';
import { CycleReviewScreen } from './screens/CycleReviewScreen';
import { ExerciseDetailScreen } from './screens/ExerciseDetailScreen';
import { SessionDetailScreen } from './screens/SessionDetailScreen';

export type WorkoutStackParams = {
  WorkoutHomeScreen: undefined;
  WorkoutPreviewScreen: { plan: Plan; cycle: Cycle; occurrence: Occurrence };
  SessionScreen: { plan: Plan; cycle: Cycle; session: Session };
  SessionCompleteScreen: { result: SessionResult };
  CycleReviewScreen: { plan: Plan; cycle: Cycle };
  SessionDetailScreen: { sessionId: string };
  ExerciseDetailScreen: { exerciseId: string };
};

const Stack = createNativeStackNavigator<WorkoutStackParams>();

const PlansButton = () => {
  const navigation = useNavigation<NavigationProp<AppStackParams>>();
  return <HeaderButton icon={generalIcons.list} accessibilityLabel="My plans" onPress={() => navigation.navigate('PlansStack')} />;
};

export const WorkoutStack = () => {
  const opts = useStackOptions();
  return (
    <Stack.Navigator screenOptions={opts.base}>
      <Stack.Screen name="WorkoutHomeScreen" component={WorkoutHomeScreen} options={{ ...opts.root('Workout'), headerRight: () => <PlansButton /> }} />
      <Stack.Screen name="WorkoutPreviewScreen" component={WorkoutPreviewScreen} options={({ route }) => opts.screen(route.params.occurrence.workoutName ?? 'Workout')} />
      <Stack.Screen name="SessionScreen" component={SessionScreen} options={({ route }) => ({ ...opts.screen(route.params.session.workoutName), gestureEnabled: false })} />
      {/* A plain push, not a modal: popping a modal presented over the tab bar left the Workout home rendered as a sheet with no tabs. */}
      <Stack.Screen name="SessionCompleteScreen" component={SessionCompleteScreen} options={{ ...opts.base, headerShown: false, animation: 'fade', gestureEnabled: false }} />
      <Stack.Screen name="CycleReviewScreen" component={CycleReviewScreen} options={opts.screen('Cycle review')} />
      <Stack.Screen name="SessionDetailScreen" component={SessionDetailScreen} options={opts.screen('Workout')} />
      <Stack.Screen name="ExerciseDetailScreen" component={ExerciseDetailScreen} options={({ navigation }) => opts.modal('How to', () => <HeaderButton icon={generalIcons.xMark} accessibilityLabel="Close" onPress={() => navigation.goBack()} />)} />
    </Stack.Navigator>
  );
};
