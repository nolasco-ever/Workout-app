import React from 'react';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { PlansStackParams, leavePlans } from '../routes';
import { PlanWorkspace } from '../components/PlanWorkspace';
import { PlanScheduleStep } from '../components/steps/PlanScheduleStep';
import { useLayoutFamily } from '../../../components/layout/useLayoutFamily';

/** The step as a screen of its own on a phone; on a wide window the whole workspace, opened on this part. */
export const PlanScheduleScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<PlansStackParams>>();
  const { params } = useRoute<RouteProp<PlansStackParams, 'PlanScheduleScreen'>>();
  const wide = useLayoutFamily() === 'wide';
  if (wide) return <PlanWorkspace mode={params.mode} initial="schedule" onDone={() => leavePlans(navigation)} />;
  return <PlanScheduleStep mode={params.mode} />;
};
