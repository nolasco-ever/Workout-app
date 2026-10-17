import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from '../../../../components/layout/SafeAreaView';
import { NavigationProp, RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import type { AppStackParams } from '../../../../appNavigators/AppStack';
import { useAuth } from '../../../../data/auth/AuthProvider';
import { Cycle, Plan } from '../../../../data/models';
import { formatDuration, formatRecordValue, toDisplayWeight } from '../../../../data/engine/units';
import { CycleReview, getCycleReview, loadCycleForReview, markCycleReportReviewed, startNextCycle } from '../../../../data/services/workoutService';
import { countWorkingSets } from '../../../../data/engine/stats';
import { nextCycleNumberAfter } from '../../../../data/engine/schedule';
import { describeProgression, verdictLabel } from '../../../../data/engine/progressionCopy';
import { notificationRepository } from '../../../../data/repositories/notificationRepository';
import { CustomText } from '../../../../components/text/customText';
import { Icon } from '../../../../components/icons/Icon';
import { directionIcons, generalIcons } from '../../../../components/icons/icon-library';
import { dateLabel } from '../../../../components/charts/scale';
import { useTheme } from '../../../../theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WorkoutStackParams } from '../WorkoutStack';
import { useTabBarInset } from '../../../../navigation/useTabBarInset';
import { SurfaceCard as Card } from '../../../../components/cards/SurfaceCard';
import { PrimaryButton } from '../../../../components/buttons/PrimaryButton';

/** One of the three headline numbers: the value big, the label under it. */
const Hero = ({ label, value, tone }: { label: string; value: string; tone?: string }) => {
  const { colors } = useTheme();
  return (
    <View style={{ flex: 1 }}>
      {/* Shrinks rather than wraps: a five-figure volume was breaking onto a second line. */}
      <CustomText variant="display" color={tone} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.6} style={{ fontVariant: ['tabular-nums'] }}>{value}</CustomText>
      <CustomText variant="caption" color={colors.inkMuted}>{label}</CustomText>
    </View>
  );
};

/** A secondary stat as a list row: label left, value right. */
const DetailRow = ({ label, value, tone, first = false }: { label: string; value: string; tone?: string; first?: boolean }) => {
  const { colors, spacing } = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: spacing.sm, borderTopWidth: first ? 0 : 1, borderTopColor: colors.line }}>
      <CustomText variant="body" color={colors.inkMuted}>{label}</CustomText>
      <CustomText variant="bodyStrong" color={tone} style={{ fontVariant: ['tabular-nums'] }}>{value}</CustomText>
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
  const { params } = useRoute<RouteProp<AppStackParams, 'CycleReviewScreen'>>();
  return <CycleReviewView cycleId={params.cycleId} plan={params.plan} cycle={params.cycle} onOpenSession={(sessionId, workoutName) => navigation.navigate('SessionDetailScreen', { sessionId, workoutName })} />;
};

/**
 * The review itself, by cycle id or with the live plan and cycle. A tapped
 * session goes to `onOpenSession`: the screen pushes it, the History
 * screen's detail pane on a wide window shows it in place.
 */
export const CycleReviewView = ({ cycleId, plan: planProp, cycle: cycleProp, onOpenSession, embedded = false }: { cycleId?: string; plan?: Plan; cycle?: Cycle; onOpenSession: (sessionId: string, workoutName: string) => void; embedded?: boolean }) => {
  const navigation = useNavigation<NavigationProp<WorkoutStackParams>>();
  const params = { cycleId, plan: planProp, cycle: cycleProp };
  const { colors, spacing, radius } = useTheme();
  const bottomInset = useTabBarInset();
  const insets = useSafeAreaInsets();
  const { uid, profile } = useAuth();
  const [loaded, setLoaded] = useState<{ plan: Plan; cycle: Cycle } | null>(params.cycle && params.plan ? { plan: params.plan, cycle: params.cycle } : null);
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
    getCycleReview(uid, loaded.plan, loaded.cycle, profile?.weightUnit ?? 'lb').then(setReview).catch(err => console.warn(err));
    // Opening the review is what the feed item was for, and it unlocks the next cycle.
    notificationRepository.markRead(uid, `cycle_finished:${loaded.cycle.id}`).catch(() => undefined);
    if (loaded.cycle.status === 'active' && !loaded.cycle.reportReviewedAt) markCycleReportReviewed(uid, loaded.cycle).catch(() => undefined);
    // The unit only changes the labels; no need to refetch for it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uid, loaded]);

  if (missing) {
    return (
      <SafeAreaView edges={['bottom', 'left', 'right']} style={{ flex: 1, backgroundColor: colors.ground, alignItems: 'center', justifyContent: 'center', padding: spacing.xl, gap: spacing.md }}>
        <Icon icon={generalIcons.error} size={36} color={colors.inactive} />
        <CustomText variant="heading" centered>Cycle not found</CustomText>
        <CustomText variant="body" color={colors.inkMuted} centered>It may have been removed with its plan.</CustomText>
      </SafeAreaView>
    );
  }

  if (!loaded || !review) {
    return (
      <SafeAreaView edges={['bottom', 'left', 'right']} style={{ flex: 1, backgroundColor: colors.ground, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={colors.accent} />
      </SafeAreaView>
    );
  }

  const { plan, cycle } = loaded;
  const { summary } = review;
  const records = summary.personalRecords.length;
  const volume = Math.round(toDisplayWeight(review.volumeKg, unit) ?? 0);
  const sessions = [...review.sessions].sort((a, b) => b.startedAt - a.startedAt);
  const avgSec = review.sessions.length ? Math.round(review.durationSec / review.sessions.length) : 0;
  // Exercises that had a target to judge, and how many cleared it.
  const judged = review.nextTargets.filter(p => p.verdict !== null);
  const targetsHit = judged.filter(p => p.verdict !== 'missed').length;
  const startNext = async () => {
    if (!uid) return;
    setBusy(true);
    try {
      await startNextCycle(uid, plan, cycle);
      // Spelled out from the root: this screen sits over the tabs, where a bare 'WorkoutHomeScreen' is unknown. `pop`
      // goes back down to the tabs instead of pushing a second copy of them over this screen.
      (navigation as unknown as NavigationProp<AppStackParams>).navigate('TabNavigator', { screen: 'WorkoutStack', params: { screen: 'WorkoutHomeScreen' } } as never, { pop: true });
    } finally {
      setBusy(false);
    }
  };

  const body = (
    <>
      <ScrollView contentInsetAdjustmentBehavior="automatic" showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing.xl + (embedded ? insets.bottom : 0)}}>
        {/* Which cycle, then the three numbers that matter, then the rest a size down. */}
        <CustomText variant="overline" color={colors.inkMuted}>
          {plan.name} · Cycle {cycle.number} · {dateLabel(cycle.startDate)} to {dateLabel(cycle.endDate)}
        </CustomText>
        <Card>
          <View style={{ flexDirection: 'row', gap: spacing.md }}>
            <Hero label="workouts" value={`${summary.completed}/${summary.totalWorkouts}`} tone={summary.completed === summary.totalWorkouts && summary.totalWorkouts > 0 ? colors.success : undefined} />
            <Hero label={records === 1 ? 'record' : 'records'} value={String(records)} tone={records > 0 ? colors.accent : undefined} />
            <Hero label={`${unit} moved`} value={volume ? volume.toLocaleString() : '—'} />
          </View>
        </Card>
        {/* The rest as a quiet list in two groups, so "on time" and "pushed" read as schedule facts. */}
        <View style={{ gap: spacing.sm }}>
          <CustomText variant="overline" color={colors.inkMuted}>Stats</CustomText>
          <Card style={{ paddingVertical: spacing.sm, gap: spacing.md }}>
            <View>
              <CustomText variant="overline" color={colors.accent} style={{ paddingTop: spacing.xs, paddingBottom: spacing.xs }}>Training</CustomText>
              <DetailRow first label="Total time trained" value={review.durationSec ? formatDuration(review.durationSec) : '—'} />
              <DetailRow label="Avg per workout" value={avgSec ? formatDuration(avgSec) : '—'} />
              <DetailRow label="Total sets" value={String(review.setsCompleted)} />
              {judged.length > 0 && <DetailRow label="Targets hit" value={`${targetsHit} of ${judged.length}`} tone={targetsHit === judged.length ? colors.success : targetsHit === 0 ? colors.warning : undefined} />}
            </View>
            <View>
              <CustomText variant="overline" color={colors.accent} style={{ paddingTop: spacing.xs, paddingBottom: spacing.xs }}>Schedule</CustomText>
              <DetailRow first label="Done on time" value={String(summary.completedOnTime)} />
              <DetailRow label="Pushed to another day" value={String(summary.pushed)} tone={summary.pushed ? colors.warning : undefined} />
              <DetailRow label="Skipped" value={String(summary.skipped)} tone={summary.skipped ? colors.error : undefined} />
            </View>
          </Card>
        </View>

        {records > 0 && (
          <View style={{ gap: spacing.sm }}>
            <CustomText variant="overline" color={colors.inkMuted}>New records</CustomText>
            <Card style={{ padding: 0 }}>
              {summary.personalRecords.map((pr, i) => (
                <View key={`${pr.exerciseId}-${pr.sessionId}-${pr.kind}`} style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingHorizontal: spacing.lg, paddingVertical: spacing.md, borderTopWidth: i ? 1 : 0, borderTopColor: colors.line }}>
                  <Icon icon={generalIcons.trophy} size={18} color={colors.accent} />
                  <View style={{ flex: 1 }}>
                    <CustomText variant="bodyStrong">{pr.exerciseName}</CustomText>
                    <CustomText variant="caption" color={colors.inkMuted}>
                      {pr.previousValue !== null ? `Up from ${formatRecordValue(pr.kind, pr.previousValue, unit, dist)}` : 'First record'}
                    </CustomText>
                  </View>
                  <CustomText variant="bodyStrong" color={colors.accent}>{formatRecordValue(pr.kind, pr.value, unit, dist)}</CustomText>
                </View>
              ))}
            </Card>
          </View>
        )}

        {review.nextTargets.length > 0 && (
          <View style={{ gap: spacing.sm }}>
            <CustomText variant="overline" color={colors.inkMuted}>Next cycle</CustomText>
            <Card style={{ padding: 0 }}>
              {review.nextTargets.map((p, i) => {
                const { next, previous, did, reason } = describeProgression(p, unit);
                const tone = p.change === 'increase' ? colors.success : p.change === 'climb' ? colors.accent : p.change === 'drop' ? colors.warning : colors.inkMuted;
                const icon = p.change === 'increase' || p.change === 'climb' ? directionIcons.angleUp : p.change === 'drop' ? directionIcons.angleDown : generalIcons.minus;
                const verdict = verdictLabel(p.verdict);
                const verdictTone = p.verdict === 'beat' ? colors.accent : p.verdict === 'hit' ? colors.success : colors.warning;
                return (
                  <View key={p.workoutExerciseId} style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.lg, borderTopWidth: i ? 1 : 0, borderTopColor: colors.line }}>
                    <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: colors.surfaceRaised, alignItems: 'center', justifyContent: 'center' }}>
                      <Icon icon={icon} size={18} color={tone} strokeWidth={2.5} />
                    </View>
                    <View style={{ flex: 1, gap: spacing.xs }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                        <View style={{ flex: 1 }}>
                          <CustomText variant="bodyStrong">{p.exerciseName}</CustomText>
                        </View>
                        {/* How the cycle went against the target, at a glance. */}
                        {verdict && (
                          <View style={{ paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: radius.pill, backgroundColor: colors.surfaceRaised }}>
                            <CustomText variant="overline" color={verdictTone}>{verdict}</CustomText>
                          </View>
                        )}
                      </View>
                      {/* What was done against what was asked, then the coming target and why. */}
                      {did && (
                        <CustomText variant="caption" color={colors.ink}>
                          Did {did}{previous ? ` · asked ${previous}` : ''}
                        </CustomText>
                      )}
                      <CustomText variant="label" color={tone}>Next {next}</CustomText>
                      <CustomText variant="caption" color={colors.inkMuted}>{reason}</CustomText>
                    </View>
                  </View>
                );
              })}
            </Card>
          </View>
        )}

        {sessions.length > 0 && (
          <View style={{ gap: spacing.sm }}>
            <CustomText variant="overline" color={colors.inkMuted}>Workouts</CustomText>
            <Card style={{ padding: 0 }}>
              {sessions.map((s, i) => {
                const sets = countWorkingSets([s]);
                const duration = s.finishedAt ? formatDuration(Math.round((s.finishedAt - s.startedAt) / 1000)) : null;
                return (
                  <TouchableOpacity
                    key={s.id}
                    onPress={() => onOpenSession(s.id, s.workoutName)}
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
        {/* Swap an exercise or move a day before the next cycle starts; a synced copy of a buddy's plan is theirs to change. */}
        {cycle.status === 'active' && !plan.sharedFrom?.synced && (
          <PrimaryButton label="Adjust plan" variant="outline" onPress={() => (navigation as unknown as NavigationProp<AppStackParams>).navigate('PlanEditScreen', { planId: plan.id })} />
        )}
      </ScrollView>
      {/* Pinned, so starting the next cycle is one tap from anywhere in the review. */}
      {cycle.status === 'active' && (
        <View style={{ padding: spacing.lg, paddingBottom: spacing.lg + bottomInset, borderTopWidth: 1, borderTopColor: colors.line, backgroundColor: colors.ground }}>
          <PrimaryButton label={`Start cycle ${nextCycleNumberAfter(cycle)}`} busy={busy} onPress={() => { startNext().catch(err => console.warn(err)); }} />
        </View>
      )}
    </>
  );
  // Inside another screen the host already keeps clear of the display's edges.
  if (embedded) return <View style={{ flex: 1, backgroundColor: colors.ground }}>{body}</View>;
  return (
    <SafeAreaView edges={['left', 'right', 'bottom']} style={{ flex: 1, backgroundColor: colors.ground }}>
      {body}
    </SafeAreaView>
  );
};
