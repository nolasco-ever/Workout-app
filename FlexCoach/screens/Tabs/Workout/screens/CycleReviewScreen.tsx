import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NavigationProp, RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { useAuth } from '../../../../data/auth/AuthProvider';
import { Cycle, Plan } from '../../../../data/models';
import { formatDistance, formatDuration, formatWeight, toDisplayWeight } from '../../../../data/engine/units';
import { CycleReview, getCycleReview, loadCycleForReview, startNextCycle } from '../../../../data/services/workoutService';
import { notificationRepository } from '../../../../data/repositories/notificationRepository';
import { CustomText } from '../../../../components/text/customText';
import { Icon } from '../../../../components/icons/Icon';
import { directionIcons, generalIcons } from '../../../../components/icons/icon-library';
import { dateLabel } from '../../../../components/charts/scale';
import { useTheme } from '../../../../theme';
import { WorkoutStackParams } from '../WorkoutStack';
import { useTabBarInset } from '../../../../navigation/useTabBarInset';
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

/**
 * The "sprint review" for one cycle. Opened with the live plan and cycle
 * from the Workout tab, or with just a cycle id from a notification or the
 * feed, in which case both are loaded here. Only the active cycle offers to
 * start the next one.
 */
export const CycleReviewScreen = () => {
  const navigation = useNavigation<NavigationProp<WorkoutStackParams>>();
  const { params } = useRoute<RouteProp<WorkoutStackParams, 'CycleReviewScreen'>>();
  const { colors, spacing } = useTheme();
  const tabBarInset = useTabBarInset();
  const { uid, profile } = useAuth();
  const [loaded, setLoaded] = useState<{ plan: Plan; cycle: Cycle } | null>(params.cycle ? { plan: params.plan, cycle: params.cycle } : null);
  const [missing, setMissing] = useState(false);
  const [review, setReview] = useState<CycleReview | null>(null);
  const [busy, setBusy] = useState(false);
  const unit = profile?.weightUnit ?? 'lb';
  const dist = profile?.distanceUnit ?? 'mi';

  useEffect(() => {
    if (!uid || loaded || !params.cycleId) return;
    loadCycleForReview(uid, params.cycleId)
      .then(result => (result ? setLoaded(result) : setMissing(true)))
      .catch(err => {
        console.warn(err);
        setMissing(true);
      });
  }, [uid, loaded, params.cycleId]);

  useEffect(() => {
    if (!uid || !loaded) return;
    getCycleReview(uid, loaded.cycle).then(setReview).catch(err => console.warn(err));
    // Opening the review is what the feed item was for.
    notificationRepository.markRead(uid, `cycle_finished:${loaded.cycle.id}`).catch(() => undefined);
  }, [uid, loaded]);

  if (missing) {
    return (
      <SafeAreaView edges={['bottom']} style={{ flex: 1, backgroundColor: colors.ground, alignItems: 'center', justifyContent: 'center', padding: spacing.xl, gap: spacing.md }}>
        <Icon icon={generalIcons.error} size={36} color={colors.inactive} />
        <CustomText variant="heading" centered>Cycle not found</CustomText>
        <CustomText variant="body" color={colors.inkMuted} centered>It may have been removed with its plan.</CustomText>
      </SafeAreaView>
    );
  }

  if (!loaded || !review) {
    return (
      <SafeAreaView edges={['bottom']} style={{ flex: 1, backgroundColor: colors.ground, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={colors.accent} />
      </SafeAreaView>
    );
  }

  const { plan, cycle } = loaded;
  const { summary } = review;
  const headline =
    summary.completed === summary.totalWorkouts && summary.pushed === 0
      ? 'Every workout, on schedule.'
      : summary.completed === summary.totalWorkouts
        ? 'Every workout done.'
        : summary.completed === 0
          ? 'A cycle to leave behind.'
          : `${summary.completed} of ${summary.totalWorkouts} workouts done.`;
  const volume = Math.round(toDisplayWeight(review.volumeKg, unit) ?? 0);
  const sessions = [...review.sessions].sort((a, b) => b.startedAt - a.startedAt);

  return (
    <SafeAreaView edges={['bottom', 'left', 'right']} style={{ flex: 1, backgroundColor: colors.ground }}>
      <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing.lg + tabBarInset }}>
        <View>
          <CustomText variant="overline" color={colors.inkMuted}>
            {plan.name} · Cycle {cycle.number} · {dateLabel(cycle.startDate)} to {dateLabel(cycle.endDate)}
          </CustomText>
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
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.lg, justifyContent: 'space-between' }}>
            <Stat label="Volume" value={volume ? `${volume.toLocaleString()} ${unit}` : '—'} />
            <Stat label="Time trained" value={review.durationSec ? formatDuration(review.durationSec) : '—'} />
            <Stat label="Sets" value={String(review.setsCompleted)} />
            <Stat label="Per workout" value={review.sessions.length ? formatDuration(Math.round(review.durationSec / review.sessions.length)) : '—'} />
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
        {sessions.length > 0 && (
          <View style={{ gap: spacing.sm }}>
            <CustomText variant="overline" color={colors.inkMuted}>Workouts</CustomText>
            <Card style={{ padding: 0 }}>
              {sessions.map((s, i) => {
                const sets = s.exercises.reduce((n, ex) => n + ex.sets.filter(x => x.completed).length, 0);
                const duration = s.finishedAt ? formatDuration(Math.round((s.finishedAt - s.startedAt) / 1000)) : null;
                return (
                  <TouchableOpacity
                    key={s.id}
                    onPress={() => navigation.navigate('SessionDetailScreen', { sessionId: s.id })}
                    style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.lg, borderTopWidth: i ? 1 : 0, borderTopColor: colors.line }}
                  >
                    <View style={{ flex: 1 }}>
                      <CustomText variant="bodyStrong">{s.workoutName}</CustomText>
                      <CustomText variant="caption" color={colors.inkMuted}>
                        {dateLabel(s.date)} · {sets} set{sets === 1 ? '' : 's'}{duration ? ` · ${duration}` : ''}
                      </CustomText>
                    </View>
                    <Icon icon={directionIcons.angleRight} size={18} color={colors.inactive} />
                  </TouchableOpacity>
                );
              })}
            </Card>
          </View>
        )}
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
