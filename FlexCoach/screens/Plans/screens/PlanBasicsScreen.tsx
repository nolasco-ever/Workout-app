import React from 'react';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { PlansStackParams } from '../PlansStack';
import { PlanWorkspace } from '../components/PlanWorkspace';
import { PlanBasicsStep } from '../components/steps/PlanBasicsStep';
import { useLayoutFamily } from '../../../components/layout/useLayoutFamily';

/** The step as a screen of its own on a phone; on a wide window the whole workspace, opened on this part. */
export const PlanBasicsScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<PlansStackParams>>();
  const { params } = useRoute<RouteProp<PlansStackParams, 'PlanBasicsScreen'>>();
  const wide = useLayoutFamily() === 'wide';
  if (wide) return <PlanWorkspace mode={params.mode} initial="basics" onDone={() => navigation.popToTop()} />;
  return <PlanBasicsStep mode={params.mode} />;
};
