import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import { useWorkoutHome } from '../../../../data/hooks/useWorkoutHome';
import { useAuth } from '../../../../data/auth/AuthProvider';
import { Occurrence } from '../../../../data/models';
import { findWorkout } from '../../../../data/engine/schedule';
import { fromLocalDate } from '../../../../data/engine/dates';
import { pushWorkoutTo, seedSamplePlan, skipWorkout, startSession } from '../../../../data/services/workoutService';
import { startFreshCycle } from '../../../../data/services/planService';
import { CustomText } from '../../../../components/text/customText';
import { Icon } from '../../../../components/icons/Icon';
import { generalIcons } from '../../../../components/icons/icon-library';
import { useTheme } from '../../../../theme';
import { WorkoutStackParams } from '../WorkoutStack';
import { SurfaceCard as Card } from '../../../../components/cards/SurfaceCard';
import { PrimaryButton } from '../../../../components/buttons/PrimaryButton';
import { OccurrenceRow } from '../components/OccurrenceRow';
import { AppStackParams } from '../../../../appNavigators/AppStack';
import { devFlags } from '../../../../dev/flags';

const longDate = (d: string) => fromLocalDate(d).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' });

export const WorkoutHomeScreen = () => {
  const navigation = useNavigation<NavigationProp<WorkoutStackParams>>();
  const { colors, spacing } = useTheme();
  const { uid, profile } = useAuth();
  const state = useWorkoutHome();
  const [busy, setBusy] = useState<string | null>(null);

  const run = async (key: string, fn: () => Promise<void>) => {
    setBusy(key);
    try {
      await fn();
    } catch (err) {
      console.warn(err);
    } finally {
      setBusy(null);
    }
  };

  useEffect(() => {
    if (__DEV__ && devFlags.seedSamplePlanIfEmpty && uid && !state.loading && !state.plan && busy === null) {
      run('seed', async () => { await seedSamplePlan(uid); });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uid, state.loading, state.plan]);

  if (state.loading) {
    return (
      <SafeAreaView edges={['left', 'right']} style={{ flex: 1, backgroundColor: colors.ground, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={colors.accent} />
      </SafeAreaView>
    );
  }

  const { plan, cycle } = state;

  if (plan && !cycle) {
    return (
      <SafeAreaView edges={['left', 'right']} style={{ flex: 1, backgroundColor: colors.ground }}>
        <View style={{ flex: 1, padding: spacing.xl, justifyContent: 'center', gap: spacing.lg }}>
          <CustomText variant="overline" color={colors.inkMuted}>{plan.name}</CustomText>
          <CustomText variant="title">Ready when you are</CustomText>
          <CustomText variant="body" color={colors.inkMuted}>This plan is active but has no cycle running. Start one and today's workout appears here.</CustomText>
          <PrimaryButton label="Start cycle" busy={busy === 'cycle'} onPress={() => run('cycle', async () => { if (uid) await startFreshCycle(uid, plan); })} />
        </View>
      </SafeAreaView>
    );
  }

  if (!plan || !cycle) {
    return (
      <SafeAreaView edges={['left', 'right']} style={{ flex: 1, backgroundColor: colors.ground }}>
        <View style={{ flex: 1, padding: spacing.xl, justifyContent: 'center', gap: spacing.lg }}>
          <Icon icon={generalIcons.dumbbell} color={colors.accent} size={40} />
          <CustomText variant="title">No active plan</CustomText>
          <CustomText variant="body" color={colors.inkMuted}>
            Build a plan with your splits and a schedule, and this tab will show you what to do each day.
          </CustomText>
          <PrimaryButton
            label="Create a plan"
            onPress={() => (navigation as unknown as NavigationProp<AppStackParams>).navigate('PlansStack')}
          />
        </View>
      </SafeAreaView>
    );
  }

  const workoutsTotal = cycle.occurrences.filter(o => o.status !== 'rest').length;
  const workoutsDone = cycle.occurrences.filter(o => o.status === 'completed').length;
  const dayIndex = cycle.occurrences.findIndex(o => o.date >= state.todayDate);
  const dayLabel = dayIndex === -1 ? `${cycle.occurrences.length} days` : `Day ${dayIndex + 1} of ${cycle.occurrences.length}`;

  const openPreview = (occurrence: Occurrence) => navigation.navigate('WorkoutPreviewScreen', { plan, cycle, occurrence });

  const start = (occurrence: Occurrence) =>
    run(`start-${occurrence.id}`, async () => {
      if (!uid) return;
      const { session, cycle: updated } = await startSession(uid, plan, cycle, occurrence);
      navigation.navigate('SessionScreen', { plan, cycle: updated, session });
    });

  const todayWorkout = state.todayOccurrence ? findWorkout(plan, state.todayOccurrence.workoutId) : undefined;
  const resume = state.inProgressSession;

  return (
    <SafeAreaView edges={['left', 'right']} style={{ flex: 1, backgroundColor: colors.ground }}>
      <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing.xxl }}>
        {/* Cycle header */}
        <View style={{ gap: spacing.xs }}>
          <CustomText variant="overline" color={colors.inkMuted}>
            {plan.name} · Cycle {cycle.number}
          </CustomText>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <CustomText variant="title">{dayLabel}</CustomText>
            <CustomText variant="caption" color={colors.inkMuted}>
              {workoutsDone} of {workoutsTotal} workouts done
            </CustomText>
          </View>
          <View style={{ height: 6, borderRadius: 3, backgroundColor: colors.surfaceRaised, overflow: 'hidden' }}>
            <View style={{ height: 6, width: `${workoutsTotal ? (workoutsDone / workoutsTotal) * 100 : 0}%`, backgroundColor: colors.accent }} />
          </View>
        </View>

        {/* Finished cycle */}
        {state.cycleFinished && (
          <Card tone="accent">
            <CustomText variant="heading">Cycle {cycle.number} is done</CustomText>
            <CustomText variant="body" color={colors.inkMuted} style={{ marginTop: spacing.xs, marginBottom: spacing.md }}>
              See how it went, then start the next one.
            </CustomText>
            <PrimaryButton label="Review cycle" onPress={() => navigation.navigate('CycleReviewScreen', { plan, cycle })} />
          </Card>
        )}

        {/* Resume */}
        {resume && (
          <Card tone="accent">
            <CustomText variant="overline" color={colors.accent}>In progress</CustomText>
            <CustomText variant="heading" style={{ marginTop: spacing.xs }}>{resume.workoutName}</CustomText>
            <CustomText variant="caption" color={colors.inkMuted} style={{ marginBottom: spacing.md }}>
              Started {new Date(resume.startedAt).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}
            </CustomText>
            <PrimaryButton label="Resume workout" icon={generalIcons.play} onPress={() => navigation.navigate('SessionScreen', { plan, cycle, session: resume })} />
          </Card>
        )}

        {/* Overdue decisions */}
        {!state.cycleFinished &&
          state.overdue.map(o => (
            <Card key={o.id}>
              <CustomText variant="overline" color={colors.warning}>Missed</CustomText>
              <CustomText variant="heading" style={{ marginTop: spacing.xs }}>{o.workoutName}</CustomText>
              <CustomText variant="caption" color={colors.inkMuted} style={{ marginBottom: spacing.md }}>
                Was scheduled for {longDate(o.date)}
              </CustomText>
              <View style={{ flexDirection: 'row', gap: spacing.sm }}>
                <View style={{ flex: 1 }}>
                  <PrimaryButton label="Skip" variant="outline" busy={busy === `skip-${o.id}`} onPress={() => run(`skip-${o.id}`, async () => { if (uid) await skipWorkout(uid, cycle, o.id); })} />
                </View>
                <View style={{ flex: 1 }}>
                  <PrimaryButton label="Do it today" busy={busy === `push-${o.id}`} onPress={() => run(`push-${o.id}`, async () => { if (uid) await pushWorkoutTo(uid, plan, cycle, o.id, state.todayDate); })} />
                </View>
              </View>
            </Card>
          ))}

        {/* Today */}
        {!state.cycleFinished && !resume && (
          <Card>
            <CustomText variant="overline" color={colors.inkMuted}>Today · {longDate(state.todayDate)}</CustomText>
            {state.todayOccurrence && todayWorkout ? (
              <>
                <CustomText variant="heading" style={{ marginTop: spacing.xs }}>{todayWorkout.name}</CustomText>
                <CustomText variant="caption" color={colors.inkMuted} style={{ marginBottom: spacing.md }}>
                  {todayWorkout.exercises.length} exercises · about {Math.round(todayWorkout.exercises.reduce((s, e) => s + e.sets * (e.restSec + 45), 0) / 60)} min
                </CustomText>
                {state.todayOccurrence.status === 'completed' ? (
                  <PrimaryButton label="Completed" variant="quiet" disabled onPress={() => {}} />
                ) : state.todayOccurrence.status === 'skipped' ? (
                  <PrimaryButton label="Skipped" variant="quiet" disabled onPress={() => {}} />
                ) : (
                  <View style={{ gap: spacing.sm }}>
                    <PrimaryButton label="Start workout" icon={generalIcons.play} busy={busy === `start-${state.todayOccurrence.id}`} onPress={() => start(state.todayOccurrence!)} />
                    <PrimaryButton label="Preview exercises" variant="quiet" onPress={() => openPreview(state.todayOccurrence!)} />
                  </View>
                )}
              </>
            ) : (
              <>
                <CustomText variant="heading" style={{ marginTop: spacing.xs }}>Rest day</CustomText>
                <CustomText variant="body" color={colors.inkMuted}>
                  {state.upcoming[0] ? `Next up: ${state.upcoming[0].workoutName} on ${longDate(state.upcoming[0].date)}` : 'Nothing else scheduled this cycle.'}
                </CustomText>
              </>
            )}
          </Card>
        )}

        {/* Cycle list */}
        <View>
          <CustomText variant="heading" style={{ marginBottom: spacing.sm }}>This cycle</CustomText>
          <Card style={{ padding: 0 }}>
            {cycle.occurrences.map((o, i) => (
              <View key={o.id} style={{ borderTopWidth: i === 0 ? 0 : 1, borderTopColor: colors.line }}>
                <OccurrenceRow occurrence={o} isToday={o.date === state.todayDate} onPress={o.workoutId ? () => openPreview(o) : undefined} />
              </View>
            ))}
          </Card>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};
