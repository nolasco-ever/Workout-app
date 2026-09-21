import React from 'react';
import { View } from 'react-native';
import { Plan } from '../../../data/models';
import { CustomText } from '../../../components/text/customText';
import { SurfaceCard } from '../../../components/cards/SurfaceCard';
import { MuscleMap } from '../../../components/anatomy/MuscleMap';
import { useTheme } from '../../../theme';
import { cycleLengthDays, describeSchedule, GOAL_LABEL, muscleCoverage } from './planSummary';

/** Shared between the review step and the plan overview. */
export const PlanSummaryCard = ({ plan }: { plan: Plan }) => {
  const { colors, spacing } = useTheme();
  const coverage = muscleCoverage(plan);
  return (
    <View style={{ gap: spacing.md }}>
      <SurfaceCard>
        <CustomText variant="overline" color={colors.inkMuted}>Workouts</CustomText>
        {plan.workouts.map(w => (
          <View key={w.id} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingTop: spacing.sm }}>
            <CustomText variant="bodyStrong">{w.name || 'Untitled'}</CustomText>
            <CustomText variant="body" color={colors.inkMuted}>{w.exercises.length} exercise{w.exercises.length === 1 ? '' : 's'}</CustomText>
          </View>
        ))}
        {plan.workouts.length === 0 && <CustomText variant="body" color={colors.inkMuted} style={{ paddingTop: spacing.sm }}>None yet</CustomText>}
      </SurfaceCard>
      <SurfaceCard>
        <CustomText variant="overline" color={colors.inkMuted}>Schedule</CustomText>
        <CustomText variant="body" style={{ paddingTop: spacing.sm }}>{describeSchedule(plan)}</CustomText>
        <CustomText variant="caption" color={colors.inkMuted}>
          {plan.schedule.mode === 'rotation' ? 'Rotation' : 'Weekly'} · {cycleLengthDays(plan)}-day cycle{plan.goal ? ` · ${GOAL_LABEL[plan.goal]}` : ''}
        </CustomText>
      </SurfaceCard>
      <SurfaceCard>
        <CustomText variant="overline" color={colors.inkMuted} style={{ marginBottom: spacing.md }}>Muscle coverage</CustomText>
        <MuscleMap primary={coverage.primary} secondary={coverage.secondary} height={190} />
        {coverage.primary.length === 0 && <CustomText variant="caption" color={colors.inkMuted} centered style={{ marginTop: spacing.sm }}>Add exercises to see coverage</CustomText>}
      </SurfaceCard>
    </View>
  );
};
