import React, { useEffect } from 'react';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { PlansStackParams } from '../routes';
import { ExerciseEntry } from '../components/steps/ExerciseEntry';
import { useLayoutFamily } from '../../../components/layout/useLayoutFamily';

/** An exercise's prescription as a sheet of its own (a phone). On a wide window (a rotation mid-edit) the sheet closes onto the workout's screen, which opens the exercise in its column. */
export const ExerciseEntryScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<PlansStackParams>>();
  const { params } = useRoute<RouteProp<PlansStackParams, 'ExerciseEntryScreen'>>();
  const wide = useLayoutFamily() === 'wide';
  useEffect(() => {
    if (wide) navigation.popTo('WorkoutEditorScreen', { workoutId: params.workoutId, entryId: params.entryId });
  }, [wide, navigation, params.workoutId, params.entryId]);
  if (wide) return null;
  return <ExerciseEntry workoutId={params.workoutId} entryId={params.entryId} />;
};
