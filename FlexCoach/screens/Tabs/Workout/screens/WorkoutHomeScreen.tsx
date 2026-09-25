import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import { useWorkoutHome } from '../../../../data/hooks/useWorkoutHome';
import { usePlans } from '../../../../data/hooks/usePlans';
import { useAuth } from '../../../../data/auth/AuthProvider';
import { Occurrence, Plan } from '../../../../data/models';
import { findWorkout } from '../../../../data/engine/schedule';
import { fromLocalDate } from '../../../../data/engine/dates';
import { pushWorkoutTo, seedSamplePlan, skipWorkout, startSession } from '../../../../data/services/workoutService';
import { activatePlan, startFreshCycle, validatePlan } from '../../../../data/services/planService';
import { CustomText } from '../../../../components/text/customText';
import { Icon } from '../../../../components/icons/Icon';
import { generalIcons } from '../../../../components/icons/icon-library';
import { useTheme } from '../../../../theme';
import { WorkoutStackParams } from '../WorkoutStack';
import { useTabBarInset } from '../../../../navigation/useTabBarInset';
import { TabHeader } from '../../../../components/headers/TabHeader';
import { SurfaceCard as Card } from '../../../../components/cards/SurfaceCard';
import { PrimaryButton } from '../../../../components/buttons/PrimaryButton';
import { NotificationPermissionCard } from '../../../../components/cards/NotificationPermissionCard';
import { OccurrenceRow } from '../components/OccurrenceRow';
import { askNotToday } from '../components/notToday';
import { AppStackParams } from '../../../../appNavigators/AppStack';
import { devFlags } from '../../../../dev/flags';
import { describeSchedule } from '../../../../screens/Plans/components/planSummary';

const longDate = (d: string) => fromLocalDate(d).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' });

export const WorkoutHomeScreen = () => {
  const navigation = useNavigation<NavigationProp<WorkoutStackParams>>();
  const { colors, spacing, radius } = useTheme();
  const tabBarInset = useTabBarInset();
  const { uid } = useAuth();
  const state = useWorkoutHome();
  const { plans } = usePlans();
  const drafts = plans.filter(p => p.status === 'draft');
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

  const { plan, cycle } = state;
  const loading = state.loading;

  const occurrences = cycle?.occurrences ?? [];
  const workoutsTotal = occurrences.filter(o => o.status !== 'rest').length;
  const workoutsDone = occurrences.filter(o => o.status === 'completed').length;
  const notStarted = !!cycle && state.todayDate < cycle.startDate;
  const dayIndex = occurrences.findIndex(o => o.date >= state.todayDate);
  const dayLabel = notStarted ? `Starts ${longDate(cycle!.startDate)}` : dayIndex === -1 ? `${occurrences.length} days` : `Day ${dayIndex + 1} of ${occurrences.length}`;

  const openPreview = (occurrence: Occurrence) => plan && cycle && navigation.navigate('WorkoutPreviewScreen', { plan, cycle, occurrence });
  /** A finished day opens what was logged; anything else opens the preview. */
  const openOccurrence = (o: Occurrence) => (o.status === 'completed' && o.sessionId ? navigation.navigate('SessionDetailScreen', { sessionId: o.sessionId }) : openPreview(o));

  const start = (occurrence: Occurrence) =>
    run(`start-${occurrence.id}`, async () => {
      if (!uid || !plan || !cycle) return;
      const { session, cycle: updated } = await startSession(uid, plan, cycle, occurrence);
      navigation.navigate('SessionScreen', { plan, cycle: updated, session });
    });

  const openPlans = (planId?: string) =>
    (navigation as unknown as NavigationProp<AppStackParams>).navigate('PlansStack', planId ? { screen: 'PlanOverviewScreen', initial: false, params: { planId } } : undefined);

  const activate = (draft: Plan) =>
    run(`activate-${draft.id}`, async () => {
      if (uid) await activatePlan(uid, draft);
    });

  const todayWorkout = plan && state.todayOccurrence ? findWorkout(plan, state.todayOccurrence.workoutId) : undefined;
  const resume = state.inProgressSession;

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={{ flex: 1, backgroundColor: colors.ground }}>
      <ScrollView
        alwaysBounceVertical={false}
        contentContainerStyle={{ padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing.xxl + tabBarInset }}
      >
        {/* One scroll view for every state; the title row scrolls with the content.
            The content is never stretched to fill the screen, so short states don't scroll. */}
        <TabHeader title="Workout" action={{ icon: generalIcons.list, accessibilityLabel: 'My plans', onPress: () => openPlans() }} />
        {loading && <ActivityIndicator color={colors.accent} style={{ marginTop: spacing.xxl }} />}

        {!loading && plan && !cycle && (
          <View style={{ gap: spacing.lg, padding: spacing.sm, paddingTop: spacing.xl }}>
            <CustomText variant="overline" color={colors.inkMuted}>{plan.name}</CustomText>
            <CustomText variant="title">Ready when you are</CustomText>
            <CustomText variant="body" color={colors.inkMuted}>This plan is active but has no cycle running. Start one and today's workout appears here.</CustomText>
            <PrimaryButton label="Start cycle" busy={busy === 'cycle'} onPress={() => run('cycle', async () => { if (uid) await startFreshCycle(uid, plan); })} />
          </View>
        )}

        {!loading && !plan && (
          <View style={{ gap: spacing.lg, padding: spacing.sm, paddingTop: spacing.xl }}>
            <Icon icon={generalIcons.dumbbell} color={colors.accent} size={40} />
            <CustomText variant="title">No active plan</CustomText>
            <CustomText variant="body" color={colors.inkMuted}>
              {drafts.length
                ? 'Activate one of your plans and this tab will show you what to do each day.'
                : 'Build a plan with your splits and a schedule, and this tab will show you what to do each day.'}
            </CustomText>
            {drafts.length > 0 && (
              <Card style={{ padding: 0 }}>
                {drafts.map((draft, i) => {
                  const complete = validatePlan(draft).length === 0;
                  const key = `activate-${draft.id}`;
                  return (
                    <TouchableOpacity
                      key={draft.id}
                      onPress={() => openPlans(draft.id)}
                      style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.lg, borderTopWidth: i ? 1 : 0, borderTopColor: colors.line }}
                    >
                      <View style={{ flex: 1 }}>
                        <CustomText variant="bodyStrong">{draft.name || 'Untitled plan'}</CustomText>
                        <CustomText variant="caption" color={colors.inkMuted}>
                          {complete ? `${draft.workouts.length} workout${draft.workouts.length === 1 ? '' : 's'} · ${describeSchedule(draft)}` : 'Not finished yet'}
                        </CustomText>
                      </View>
                      <TouchableOpacity
                        accessibilityRole="button"
                        accessibilityLabel={complete ? `Activate ${draft.name}` : `Finish ${draft.name}`}
                        disabled={busy !== null}
                        onPress={() => (complete ? activate(draft) : openPlans(draft.id))}
                        style={{
                          paddingVertical: spacing.xs,
                          paddingHorizontal: spacing.md,
                          borderRadius: radius.pill,
                          backgroundColor: complete ? colors.accent : colors.surfaceRaised,
                          opacity: busy !== null && busy !== key ? 0.5 : 1,
                        }}
                      >
                        {busy === key ? (
                          <ActivityIndicator color={colors.onAccent} />
                        ) : (
                          <CustomText variant="label" color={complete ? colors.onAccent : colors.ink}>{complete ? 'Activate' : 'Finish'}</CustomText>
                        )}
                      </TouchableOpacity>
                    </TouchableOpacity>
                  );
                })}
              </Card>
            )}
            <PrimaryButton label="Create a plan" variant={drafts.length ? 'outline' : 'filled'} onPress={() => openPlans()} />
          </View>
        )}

        {!loading && plan && cycle && (
        <>
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

        {/* Notification permission, asked here rather than at launch. */}
        {!!cycle && <NotificationPermissionCard />}

        {/* Today */}
        {!state.cycleFinished && !resume && (
          <Card>
            <CustomText variant="overline" color={colors.inkMuted}>Today · {longDate(state.todayDate)}</CustomText>
            {notStarted ? (
              <>
                <CustomText variant="heading" style={{ marginTop: spacing.xs }}>Not started yet</CustomText>
                <CustomText variant="body" color={colors.inkMuted}>
                  {state.upcoming[0] ? `First up: ${state.upcoming[0].workoutName} on ${longDate(state.upcoming[0].date)}.` : `The cycle begins ${longDate(cycle.startDate)}.`}
                </CustomText>
              </>
            ) : state.todayOccurrence && todayWorkout ? (
              <>
                <CustomText variant="heading" style={{ marginTop: spacing.xs }}>{todayWorkout.name}</CustomText>
                <CustomText variant="caption" color={colors.inkMuted} style={{ marginBottom: spacing.md }}>
                  {todayWorkout.exercises.length} exercises · about {Math.round(todayWorkout.exercises.reduce((s, e) => s + e.sets * (e.restSec + 45), 0) / 60)} min
                </CustomText>
                {state.todayOccurrence.status === 'completed' ? (
                  <PrimaryButton
                    label="Completed · see workout"
                    variant="quiet"
                    icon={generalIcons.check}
                    onPress={() => state.todayOccurrence?.sessionId && navigation.navigate('SessionDetailScreen', { sessionId: state.todayOccurrence.sessionId })}
                  />
                ) : state.todayOccurrence.status === 'skipped' ? (
                  <PrimaryButton label="Skipped" variant="quiet" disabled onPress={() => {}} />
                ) : (
                  <View style={{ gap: spacing.sm }}>
                    <PrimaryButton label="Start workout" icon={generalIcons.play} busy={busy === `start-${state.todayOccurrence.id}`} onPress={() => start(state.todayOccurrence!)} />
                    <View style={{ flexDirection: 'row' }}>
                      <View style={{ flex: 1 }}>
                        <PrimaryButton label="Preview exercises" variant="quiet" onPress={() => openPreview(state.todayOccurrence!)} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <PrimaryButton
                          label="Not today"
                          variant="quiet"
                          busy={busy === `not-today-${state.todayOccurrence.id}`}
                          onPress={() => uid && askNotToday(uid, plan, cycle, state.todayOccurrence!, state.todayDate, fn => run(`not-today-${state.todayOccurrence!.id}`, fn))}
                        />
                      </View>
                    </View>
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
                <OccurrenceRow occurrence={o} isToday={o.date === state.todayDate} onPress={o.workoutId ? () => openOccurrence(o) : undefined} />
              </View>
            ))}
          </Card>
        </View>
        </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};
