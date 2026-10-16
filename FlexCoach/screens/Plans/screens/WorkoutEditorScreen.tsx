import React from 'react';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { PlansStackParams, leavePlans } from '../routes';
import { PlanWorkspace } from '../components/PlanWorkspace';
import { WorkoutEditor } from '../components/steps/WorkoutEditor';
import { usePlanEditor } from '../PlanEditorContext';
import { useLayoutFamily } from '../../../components/layout/useLayoutFamily';

/** A workout's exercises, as a screen of its own on a phone; on a wide window (a rotation mid-edit) the whole workspace, opened on this workout. */
export const WorkoutEditorScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<PlansStackParams>>();
  const { params } = useRoute<RouteProp<PlansStackParams, 'WorkoutEditorScreen'>>();
  const { original } = usePlanEditor();
  const wide = useLayoutFamily() === 'wide';
  if (wide) return <PlanWorkspace mode={original ? 'edit' : 'create'} initial="workouts" initialWorkoutId={params.workoutId} initialEntryId={params.entryId ?? null} onDone={() => leavePlans(navigation)} />;
  return <WorkoutEditor workoutId={params.workoutId} />;
};
