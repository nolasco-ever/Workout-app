import React from 'react';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { PlansStackParams } from '../PlansStack';
import { PlanWorkspace } from '../components/PlanWorkspace';
import { PlanWorkoutsStep } from '../components/steps/PlanWorkoutsStep';
import { useLayoutFamily } from '../../../components/layout/useLayoutFamily';

/** The step as a screen of its own on a phone; on a wide window the whole workspace, opened on this part. */
export const PlanWorkoutsScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<PlansStackParams>>();
  const { params } = useRoute<RouteProp<PlansStackParams, 'PlanWorkoutsScreen'>>();
  const wide = useLayoutFamily() === 'wide';
  if (wide) return <PlanWorkspace mode={params.mode} initial="workouts" onDone={() => navigation.popToTop()} />;
  return <PlanWorkoutsStep mode={params.mode} />;
};
