import React from 'react';
import { RouteProp, useRoute } from '@react-navigation/native';
import { PlansStackParams } from '../PlansStack';
import { WorkoutEditor } from '../components/steps/WorkoutEditor';

/** A workout's exercises, as a screen of its own (a phone, or a fold mid-edit). */
export const WorkoutEditorScreen = () => {
  const { params } = useRoute<RouteProp<PlansStackParams, 'WorkoutEditorScreen'>>();
  return <WorkoutEditor workoutId={params.workoutId} />;
};
