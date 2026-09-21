import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NavigationProp, RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { useAuth } from '../../../../data/auth/AuthProvider';
import { CycleSummary } from '../../../../data/models';
import { formatDistance, formatDuration, formatWeight } from '../../../../data/engine/units';
import { getCycleReview, startNextCycle } from '../../../../data/services/workoutService';
import { CustomText } from '../../../../components/text/customText';
import { useTheme } from '../../../../theme';
import { WorkoutStackParams } from '../WorkoutStack';
import { SurfaceCard as Card } from '../../../../components/cards/SurfaceCard';
import { PrimaryButton } from '../../../../components/buttons/PrimaryButton';

const Stat = ({ label, value, tone }: { label: string; value: string; tone?: string }) => {
  const { colors } = useTheme();
  return (
    <View style={{ width: '47%' }}>
      <CustomText variant="overline" color={colors.inkMuted}>{label}</CustomText>
      <CustomText variant="display" color={tone}>{value}</CustomText>
    </View>
  );
};

export const CycleReviewScreen = () => {
  const navigation = useNavigation<NavigationProp<WorkoutStackParams>>();
  const { params } = useRoute<RouteProp<WorkoutStackParams, 'CycleReviewScreen'>>();
  const { plan, cycle } = params;
  const { colors, spacing } = useTheme();
  const { uid, profile } = useAuth();
  const [summary, setSummary] = useState<CycleSummary | null>(null);
  const [busy, setBusy] = useState(false);
  const unit = profile?.weightUnit ?? 'lb';
  const dist = profile?.distanceUnit ?? 'mi';

  useEffect(() => {
    if (uid) getCycleReview(uid, cycle).then(setSummary).catch(err => console.warn(err));
  }, [uid, cycle]);

  if (!summary) {
    return (
      <SafeAreaView edges={['bottom']} style={{ flex: 1, backgroundColor: colors.ground, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={colors.accent} />
      </SafeAreaView>
    );
  }

  const headline =
    summary.completed === summary.totalWorkouts && summary.pushed === 0
      ? 'Every workout, on schedule.'
      : summary.completed === summary.totalWorkouts
        ? 'Every workout done.'
        : summary.completed === 0
          ? 'A cycle to leave behind.'
          : `${summary.completed} of ${summary.totalWorkouts} workouts done.`;

  return (
    <SafeAreaView edges={['bottom', 'left', 'right']} style={{ flex: 1, backgroundColor: colors.ground }}>
      <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.lg }}>
        <View>
          <CustomText variant="overline" color={colors.inkMuted}>{plan.name} · Cycle {cycle.number}</CustomText>
          <CustomText variant="title">{headline}</CustomText>
        </View>
        <Card>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.lg, justifyContent: 'space-between' }}>
            <Stat label="Completed" value={`${summary.completed}/${summary.totalWorkouts}`} tone={colors.success} />
            <Stat label="On time" value={String(summary.completedOnTime)} />
            <Stat label="Pushed" value={String(summary.pushed)} tone={summary.pushed ? colors.warning : undefined} />
            <Stat label="Skipped" value={String(summary.skipped)} tone={summary.skipped ? colors.error : undefined} />
          </View>
        </Card>
        <Card>
          <CustomText variant="heading" style={{ marginBottom: spacing.sm }}>
            {summary.personalRecords.length ? `${summary.personalRecords.length} personal record${summary.personalRecords.length > 1 ? 's' : ''}` : 'No new records this cycle'}
          </CustomText>
          {summary.personalRecords.map(pr => (
            <View key={`${pr.exerciseId}-${pr.sessionId}`} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: spacing.xs }}>
              <CustomText variant="body">{pr.exerciseName}</CustomText>
              <CustomText variant="bodyStrong" color={colors.accent}>
                {pr.kind === 'weight' ? formatWeight(pr.value, unit) : pr.kind === 'reps' ? `${pr.value} reps` : pr.kind === 'duration' ? formatDuration(pr.value) : formatDistance(pr.value, dist)}
              </CustomText>
            </View>
          ))}
        </Card>
        {cycle.status === 'active' && (
          <PrimaryButton
            label={`Start cycle ${cycle.number + 1}`}
            busy={busy}
            onPress={async () => {
              if (!uid) return;
              setBusy(true);
              try {
                await startNextCycle(uid, plan, cycle);
                navigation.navigate('WorkoutHomeScreen');
              } finally {
                setBusy(false);
              }
            }}
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
};
