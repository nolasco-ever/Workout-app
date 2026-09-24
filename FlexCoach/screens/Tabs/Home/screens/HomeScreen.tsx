import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useScrollToTop } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '../../../../data/auth/AuthProvider';
import { useInsights } from '../../../../data/hooks/useInsights';
import { useWorkoutHome } from '../../../../data/hooks/useWorkoutHome';
import { useSteps } from '../../../../data/hooks/useSteps';
import { BarChart } from '../../../../components/charts/BarChart';
import { formatWeight, kgToLb, toDisplayWeight } from '../../../../data/engine/units';
import { findWorkout } from '../../../../data/engine/schedule';
import { totalVolumeKg } from '../../../../data/engine/stats';
import { CustomText } from '../../../../components/text/customText';
import { SurfaceCard } from '../../../../components/cards/SurfaceCard';
import { PrimaryButton } from '../../../../components/buttons/PrimaryButton';
import { Icon } from '../../../../components/icons/Icon';
import { directionIcons, generalIcons } from '../../../../components/icons/icon-library';
import { StatTile } from '../../../../components/charts/StatTile';
import { compactNumber, dateLabel, shortDate } from '../../../../components/charts/scale';
import { MuscleMap } from '../../../../components/anatomy/MuscleMap';
import { MuscleRow } from '../components/MuscleRow';
import { MuscleGroup } from '../../../../data/models';
import { useTheme } from '../../../../theme';
import { HomeStackParams } from '../HomeStack';
import { useTabBarInset } from '../../../../navigation/useTabBarInset';
import { devFlags } from '../../../../dev/flags';
import { seedSampleWeights } from '../../../../data/services/devSeeds';
import { askNotToday } from '../../Workout/components/notToday';

const title = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

const CardHeader = ({ label, action, onAction }: { label: string; action?: string; onAction?: () => void }) => {
  const { colors, spacing } = useTheme();
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md }}>
      <CustomText variant="heading">{label}</CustomText>
      {action && onAction && (
        <TouchableOpacity onPress={onAction} hitSlop={8} style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
          <CustomText variant="label" color={colors.accent}>{action}</CustomText>
          <Icon icon={directionIcons.angleRight} size={16} color={colors.accent} />
        </TouchableOpacity>
      )}
    </View>
  );
};

/** A card that navigates somewhere: header row with a chevron, body below. Fills its container's height. */
const LinkCard = ({ label, onPress, children }: { label: string; onPress: () => void; children: React.ReactNode }) => {
  const { colors, spacing } = useTheme();
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7} style={{ flex: 1 }}>
      <SurfaceCard style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm }}>
          <CustomText variant="heading">{label}</CustomText>
          <Icon icon={directionIcons.angleRight} size={18} color={colors.inactive} />
        </View>
        {children}
      </SurfaceCard>
    </TouchableOpacity>
  );
};

export const HomeScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<HomeStackParams>>();
  const { colors, spacing } = useTheme();
  const tabBarInset = useTabBarInset();
  const { uid, profile } = useAuth();
  const unit = profile?.weightUnit ?? 'lb';
  const ins = useInsights();
  const home = useWorkoutHome();
  const steps = useSteps();
  const scrollRef = useRef<React.ComponentRef<typeof ScrollView>>(null);
  useScrollToTop(scrollRef);
  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([ins.refresh(), steps.refresh()]);
    } finally {
      setRefreshing(false);
    }
  }, [ins.refresh, steps.refresh]);

  useEffect(() => {
    if (__DEV__ && devFlags.seedBodyWeightIfEmpty && uid && !ins.loading && ins.weightEntries.length === 0) {
      seedSampleWeights(uid).catch(err => console.warn(err));
    }
  }, [uid, ins.loading, ins.weightEntries.length]);

  const fmtVolume = (kg: number) => compactNumber(unit === 'lb' ? kgToLb(kg) : kg);
  const goWorkout = () => (navigation as any).navigate('WorkoutStack');

  const loading = ins.loading;
  const latestWeight = ins.weight[ins.weight.length - 1] ?? null;
  const weightDelta = ins.weightChangeCycle ?? ins.weightChange30d;
  const target = profile?.targetWeightKg ?? null;
  const coverage = ins.muscles30d.map(m => m.muscle as MuscleGroup);
  const maxSets = Math.max(1, ...ins.muscles30d.map(m => m.sets));

  // Today's workout status
  const todayOcc = home.todayOccurrence;
  const todayWorkout = home.plan && todayOcc ? findWorkout(home.plan, todayOcc.workoutId) : undefined;
  const canDefer = !!uid && !!home.plan && !!home.cycle && !!todayOcc && todayOcc.status === 'scheduled' && !home.inProgressSession;
  const notToday = () => {
    if (!uid || !home.plan || !home.cycle || !todayOcc) return;
    askNotToday(uid, home.plan, home.cycle, todayOcc, home.todayDate, fn => { fn().catch(err => console.warn(err)); });
  };
  const todayStatus = !home.plan
    ? { tone: colors.inkMuted, kicker: 'Today', headline: 'No plan yet', detail: 'Set up a plan and your daily workout shows here.', action: 'Set up a plan' }
    : home.inProgressSession
      ? { tone: colors.accent, kicker: 'In progress', headline: home.inProgressSession.workoutName, detail: 'Pick up where you left off.', action: 'Resume' }
      : ins.todaySession
        ? { tone: colors.success, kicker: 'Done today', headline: ins.todaySession.workoutName, detail: `${ins.todaySession.exercises.reduce((n, e) => n + e.sets.filter(s => s.completed).length, 0)} sets · ${fmtVolume(totalVolumeKg([ins.todaySession]))} ${unit} moved`, action: 'See workout' }
        : todayOcc && todayWorkout && todayOcc.status === 'scheduled'
          ? { tone: colors.accent, kicker: 'Today', headline: todayWorkout.name, detail: `${todayWorkout.exercises.length} exercises · not started`, action: 'Start' }
          : todayOcc && todayOcc.status === 'skipped'
            ? { tone: colors.error, kicker: 'Today', headline: `${todayOcc.workoutName} skipped`, detail: 'Skipped for this cycle.', action: 'Open' }
            : { tone: colors.inkMuted, kicker: 'Today', headline: 'Rest day', detail: home.upcoming[0] ? `Next: ${home.upcoming[0].workoutName} on ${shortDate(home.upcoming[0].date)}` : 'Nothing scheduled.', action: 'Open' };

  return (
    <SafeAreaView edges={['left', 'right']} style={{ flex: 1, backgroundColor: colors.ground }}>
      <ScrollView
        ref={scrollRef}
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{ padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing.xxl + tabBarInset }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />}
      >
        {/* One scroll view for every state, with the inset the native large-title header needs. */}
        {loading && <ActivityIndicator color={colors.accent} style={{ marginTop: spacing.xxl }} />}
        {!loading && (
        <>
        {/* Today */}
        <TouchableOpacity onPress={goWorkout} activeOpacity={0.7}>
          <SurfaceCard tone={todayStatus.tone === colors.accent ? 'accent' : 'surface'}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
              <View style={{ flex: 1 }}>
                <CustomText variant="overline" color={todayStatus.tone}>{todayStatus.kicker}</CustomText>
                <CustomText variant="title">{todayStatus.headline}</CustomText>
                <CustomText variant="caption" color={colors.inkMuted}>{todayStatus.detail}</CustomText>
                {canDefer && (
                  <TouchableOpacity onPress={notToday} hitSlop={8} style={{ alignSelf: 'flex-start', marginTop: spacing.sm }}>
                    <CustomText variant="label" color={colors.inkMuted}>Not today? Move or skip</CustomText>
                  </TouchableOpacity>
                )}
              </View>
              {ins.todaySession && !home.inProgressSession ? (
                <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: colors.successTint, alignItems: 'center', justifyContent: 'center' }}>
                  <Icon icon={generalIcons.check} size={22} color={colors.success} strokeWidth={3} />
                </View>
              ) : (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
                  <CustomText variant="label" color={colors.accent}>{todayStatus.action}</CustomText>
                  <Icon icon={directionIcons.angleRight} size={16} color={colors.accent} />
                </View>
              )}
            </View>
          </SurfaceCard>
        </TouchableOpacity>

        {/* This week */}
        <View style={{ flexDirection: 'row', gap: spacing.sm }}>
          <StatTile label="Streak" value={`${ins.streakDays}d`} delta={ins.streakDays > 0 ? 'Keep it going' : 'Train to start one'} />
          <StatTile
            label="This week"
            value={String(ins.week.sessionsDone)}
            delta={ins.weekRemaining > 0 ? `${ins.week.sessionsDone === 1 ? 'workout' : 'workouts'} · ${ins.weekRemaining} more planned` : ins.week.sessionsDone === 1 ? 'workout' : 'workouts'}
          />
        </View>

        {/* Muscles, last 30 days */}
        <SurfaceCard>
          <CardHeader label="Muscles, last 30 days" action={ins.muscles30d.length > 0 ? 'All' : undefined} onAction={() => navigation.navigate('MusclesScreen')} />
          {ins.muscles30d.length > 0 ? (
            <>
              <View style={{ alignItems: 'center', marginBottom: spacing.sm }}>
                <MuscleMap primary={coverage.slice(0, 6)} secondary={coverage.slice(6)} height={170} />
              </View>
              {ins.muscles30d.slice(0, 4).map((m, i) => (
                <View key={m.muscle} style={{ borderTopWidth: i ? 1 : 0, borderTopColor: colors.line }}>
                  <MuscleRow muscle={m.muscle} sets={m.sets} max={maxSets} onPress={() => navigation.navigate('MuscleDetailScreen', { muscle: m.muscle })} />
                </View>
              ))}
              {ins.muscles30d.length > 4 && (
                <CustomText variant="caption" color={colors.inkMuted} style={{ marginTop: spacing.xs }}>+{ins.muscles30d.length - 4} more in All</CustomText>
              )}
            </>
          ) : (
            <CustomText variant="body" color={colors.inkMuted}>Finish a workout and your muscle coverage shows here.</CustomText>
          )}
        </SurfaceCard>

        {/* Volume + body weight tiles */}
        <View style={{ flexDirection: 'row', gap: spacing.sm, alignItems: 'stretch' }}>
          <View style={{ flex: 1 }}>
            <LinkCard label="Volume" onPress={() => navigation.navigate('ProgressScreen')}>
              <CustomText variant="display">{fmtVolume(ins.week.volumeKg)}</CustomText>
              <CustomText variant="caption" color={colors.inkMuted}>{unit} this week</CustomText>
              <CustomText variant="caption" color={ins.week.volumeChange === null ? colors.inkMuted : ins.week.volumeChange >= 0 ? colors.success : colors.error}>
                {ins.week.volumeChange === null ? 'No last week yet' : `${ins.week.volumeChange >= 0 ? '+' : ''}${Math.round(ins.week.volumeChange * 100)}% vs last week`}
              </CustomText>
            </LinkCard>
          </View>
          <View style={{ flex: 1 }}>
        <LinkCard label="Body weight" onPress={() => navigation.navigate(latestWeight ? 'WeightHistoryScreen' : 'LogWeightScreen')}>
          {latestWeight ? (
            <View style={{ gap: 2 }}>
              <CustomText variant="display">{formatWeight(latestWeight.weightKg, unit)}</CustomText>
              <CustomText variant="caption" color={colors.inkMuted}>as of {dateLabel(latestWeight.date)}</CustomText>
              {weightDelta !== null && (
                <CustomText variant="caption" color={weightDelta <= 0 ? colors.success : colors.warning}>
                  {weightDelta > 0 ? '+' : ''}{toDisplayWeight(weightDelta, unit)} {unit} {ins.weightChangeCycle !== null ? 'this cycle' : 'in 30 days'}
                </CustomText>
              )}
              {target !== null && (
                <CustomText variant="caption" color={colors.inkMuted}>{formatWeight(Math.abs(latestWeight.trendKg - target), unit)} to go</CustomText>
              )}
            </View>
          ) : (
            <CustomText variant="body" color={colors.inkMuted}>Log your first weigh-in.</CustomText>
          )}
        </LinkCard>
          </View>
        </View>

        {/* Personal records */}
        {ins.recentRecords.length > 0 && (
          <SurfaceCard>
            <CardHeader label="Recent records" />
            {ins.recentRecords.map(pr => (
              <TouchableOpacity
                key={`${pr.exerciseId}-${pr.sessionId}`}
                onPress={() => navigation.navigate('ExerciseProgressScreen', { exerciseId: pr.exerciseId, exerciseName: pr.exerciseName })}
                style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.sm }}
              >
                <Icon icon={generalIcons.trophy} size={18} color={colors.warning} />
                <View style={{ flex: 1 }}>
                  <CustomText variant="bodyStrong">{pr.exerciseName}</CustomText>
                  <CustomText variant="caption" color={colors.inkMuted}>{dateLabel(pr.date)}{pr.previousValue !== null ? ` · up from ${pr.kind === 'weight' ? formatWeight(pr.previousValue, unit) : pr.previousValue}` : ' · first record'}</CustomText>
                </View>
                <CustomText variant="bodyStrong" color={colors.accent}>{pr.kind === 'weight' ? formatWeight(pr.value, unit) : pr.kind === 'reps' ? `${pr.value} reps` : `${pr.value}`}</CustomText>
              </TouchableOpacity>
            ))}
          </SurfaceCard>
        )}

        {/* Steps */}
        <SurfaceCard>
          <CardHeader label="Steps" />
          {steps.available === false ? (
            <CustomText variant="body" color={colors.inkMuted}>{steps.platformName === 'none' ? 'Step tracking needs a phone with a health app.' : `${steps.platformName} isn't available on this device.`}</CustomText>
          ) : !steps.connected ? (
            <>
              <CustomText variant="body" color={colors.inkMuted}>Connect {steps.platformName} to see today's steps and your weekly average. Weigh-ins sync both ways.</CustomText>
              <View style={{ marginTop: spacing.md }}>
                <PrimaryButton label={`Connect ${steps.platformName}`} icon={generalIcons.personRunning} onPress={() => steps.connect()} />
              </View>
            </>
          ) : (
            <>
              <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: spacing.sm, marginBottom: spacing.sm }}>
                <CustomText variant="display">{steps.today === null ? '—' : steps.today.toLocaleString()}</CustomText>
                <CustomText variant="caption" color={colors.inkMuted}>today</CustomText>
                {steps.weekAverage !== null && (
                  <CustomText variant="caption" color={colors.inkMuted}>· {steps.weekAverage.toLocaleString()} avg over 7 days</CustomText>
                )}
              </View>
              {steps.days.length > 0 && (
                <BarChart bars={steps.days.map(d => ({ label: shortDate(d.date).replace(' ', '\u00a0'), value: d.steps }))} format={v => compactNumber(v)} height={120} />
              )}
              {steps.days.length === 0 && !steps.loading && (
                <CustomText variant="caption" color={colors.inkMuted}>No step data yet. If you declined access, allow it in {steps.platformName} settings.</CustomText>
              )}
            </>
          )}
        </SurfaceCard>
        </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};
