import React from 'react';
import { RouteProp, useRoute } from '@react-navigation/native';
import { PlansStackParams } from '../PlansStack';
import { ExerciseEntry } from '../components/steps/ExerciseEntry';

/** An exercise's prescription as a sheet of its own (a phone). */
export const ExerciseEntryScreen = () => {
  const { params } = useRoute<RouteProp<PlansStackParams, 'ExerciseEntryScreen'>>();
  return <ExerciseEntry workoutId={params.workoutId} entryId={params.entryId} />;
};
