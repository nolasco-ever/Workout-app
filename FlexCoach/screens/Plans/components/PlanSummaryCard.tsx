import React, { useState } from 'react';
import { TouchableOpacity, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Plan, Workout } from '../../../data/models';
import { useAuth } from '../../../data/auth/AuthProvider';
import { getCatalogExercise } from '../../../data/catalog/exerciseCatalog';
import { CustomText } from '../../../components/text/customText';
import { SurfaceCard } from '../../../components/cards/SurfaceCard';
import { MuscleMap } from '../../../components/anatomy/MuscleMap';
import { Icon } from '../../../components/icons/Icon';
import { directionIcons, generalIcons } from '../../../components/icons/icon-library';
import { useTheme } from '../../../theme';
import { PlansStackParams } from '../PlansStack';
import { cycleLengthDays, describeEntry, describeSchedule, GOAL_LABEL, muscleCoverage } from './planSummary';

const title = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** One workout row: tap to expand its exercises, each with an info button for the how-to. */
const WorkoutRow = ({ workout, first }: { workout: Workout; first: boolean }) => {
  const navigation = useNavigation<NativeStackNavigationProp<PlansStackParams>>();
  const { colors, spacing } = useTheme();
  const { profile } = useAuth();
  const unit = profile?.weightUnit ?? 'lb';
  const dist = profile?.distanceUnit ?? 'mi';
  const [open, setOpen] = useState(false);
  const count = workout.exercises.length;
  return (
    <View style={{ borderTopWidth: first ? 0 : 1, borderTopColor: colors.line }}>
      <TouchableOpacity
        onPress={() => setOpen(o => !o)}
        disabled={count === 0}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.md }}
      >
        <View style={{ flex: 1 }}>
          <CustomText variant="bodyStrong">{workout.name || 'Untitled'}</CustomText>
        </View>
        <CustomText variant="body" color={colors.inkMuted}>{count} exercise{count === 1 ? '' : 's'}</CustomText>
        {count > 0 && <Icon icon={open ? directionIcons.angleUp : directionIcons.angleDown} size={18} color={colors.inactive} />}
      </TouchableOpacity>
      {open &&
        [...workout.exercises]
          .sort((a, b) => a.order - b.order)
          .map(e => {
            const cat = getCatalogExercise(e.exerciseId);
            return (
              <View key={e.id} style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingBottom: spacing.md }}>
                {cat && <MuscleMap primary={cat.primaryMuscles} secondary={cat.secondaryMuscles} height={48} views="auto" />}
                <View style={{ flex: 1 }}>
                  <CustomText variant="body" numberOfLines={1}>{e.exerciseName}</CustomText>
                  <CustomText variant="caption" color={colors.inkMuted}>
                    {cat?.primaryMuscles.map(title).join(', ')}{cat?.primaryMuscles.length ? ' · ' : ''}{describeEntry(e, unit, dist)}
                  </CustomText>
                </View>
                {cat && (
                  <TouchableOpacity onPress={() => navigation.navigate('ExerciseDetailScreen', { exerciseId: e.exerciseId })} hitSlop={8} accessibilityRole="button" accessibilityLabel={`How to do ${e.exerciseName}`}>
                    <Icon icon={generalIcons.info} size={20} color={colors.inkMuted} />
                  </TouchableOpacity>
                )}
              </View>
            );
          })}
    </View>
  );
};

/** Shared between the review step and the plan overview. */
export const PlanSummaryCard = ({ plan }: { plan: Plan }) => {
  const { colors, spacing } = useTheme();
  const coverage = muscleCoverage(plan);
  const workouts = [...plan.workouts].sort((a, b) => a.order - b.order);
  return (
    <View style={{ gap: spacing.md }}>
      <SurfaceCard style={{ paddingVertical: spacing.sm }}>
        <CustomText variant="overline" color={colors.inkMuted} style={{ paddingTop: spacing.sm }}>Workouts</CustomText>
        {workouts.map((w, i) => (
          <WorkoutRow key={w.id} workout={w} first={i === 0} />
        ))}
        {workouts.length === 0 && <CustomText variant="body" color={colors.inkMuted} style={{ paddingVertical: spacing.md }}>None yet</CustomText>}
        {workouts.some(w => w.exercises.length > 0) && (
          <CustomText variant="caption" color={colors.inkMuted} style={{ paddingBottom: spacing.sm }}>Tap a workout to see its exercises.</CustomText>
        )}
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
