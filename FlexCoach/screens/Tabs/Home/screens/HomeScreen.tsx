import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from '../../../../components/layout/SafeAreaView';
import { NavigationProp, useNavigation, useScrollToTop } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '../../../../data/auth/AuthProvider';
import { useInsights } from '../../../../data/hooks/useInsights';
import { useWorkoutHome } from '../../../../data/hooks/useWorkoutHome';
import { useSteps } from '../../../../data/hooks/useSteps';
import { BarChart } from '../../../../components/charts/BarChart';
import { formatRecordValue, formatWeight, kgToLb, toDisplayWeight } from '../../../../data/engine/units';
import { findWorkout } from '../../../../data/engine/schedule';
import { countWorkingSets, totalVolumeKg } from '../../../../data/engine/stats';
import { CustomText } from '../../../../components/text/customText';
import { SurfaceCard } from '../../../../components/cards/SurfaceCard';
import { PrimaryButton } from '../../../../components/buttons/PrimaryButton';
import { Icon } from '../../../../components/icons/Icon';
import { directionIcons, generalIcons } from '../../../../components/icons/icon-library';
import { StatTile } from '../../../../components/charts/StatTile';
import { BottomSheet } from '../../../../components/overlays/BottomSheet';
import { compactNumber, dateLabel, shortDate } from '../../../../components/charts/scale';
import { MuscleMap } from '../../../../components/anatomy/MuscleMap';
import { MuscleRow } from '../components/MuscleRow';
import { MuscleGroup } from '../../../../data/models';
import { useTheme } from '../../../../theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { HomeStackParams } from '../HomeStack';
import { useTabBarSidePlaced, useTabScrollInset } from '../../../../navigation/useTabBarInset';
import { useLayoutFamily } from '../../../../components/layout/useLayoutFamily';
import { useBookGutter } from '../../../../components/layout/useBookGutter';
import { StickyTabHeader, estimateStickyHeaderHeight } from '../../../../components/headers/StickyTabHeader';
import { useNotificationFeed } from '../../../../data/notifications/useNotificationFeed';
import { AppStackParams } from '../../../../appNavigators/AppStack';
import { devFlags } from '../../../../dev/flags';
import { seedSampleWeights } from '../../../../data/services/devSeeds';
import { askNotToday } from '../../Workout/components/notToday';
import { markCycleReportPrompted, startQuickSession } from '../../../../data/services/workoutService';
import { CycleReportModal } from '../../../../components/overlays/CycleReportModal';
import { useBuddies } from '../../../../data/hooks/useBuddies';
import { useBuddyActivity } from '../../../../data/hooks/useBuddyActivity';
import { useBuddyPlans } from '../../../../data/hooks/useBuddyPlans';
import { ActivityRow } from '../../../../components/buddies/ActivityRow';
import { Avatar } from '../../../../components/buddies/Avatar';
import { BuddyRoutes } from '../../../Buddies/routes';

const title = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** Groups the Home cards. A little air above each one keeps the page from reading as one long stack. */
const SectionHeader = ({ label, first = false }: { label: string; first?: boolean }) => {
  const { colors, spacing } = useTheme();
  return (
    <CustomText variant="sectionLabel" color={colors.inkMuted} style={{ marginTop: first ? 0 : spacing.sm, marginBottom: -spacing.xs }}>
      {label}
    </CustomText>
  );
};

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
  const bottomInset = useTabScrollInset();
  const insets = useSafeAreaInsets();
  // The title row is a bar over the scroll view; the content starts under it.
  const [headerHeight, setHeaderHeight] = useState(() => estimateStickyHeaderHeight(insets.top, spacing));
  // Room under the last card: less when no tab bar floats over the bottom.
  const bottomRoom = useTabBarSidePlaced() ? spacing.lg : spacing.xxl;
  const family = useLayoutFamily();
  // Held like a book, the panes split on the crease.
  const book = useBookGutter();
  // The left column's width is always a number, measured from the row: a style that drops its width, or sets a flex
  // basis instead, does not take on this screen (seen on the Duo: the column stuck at its old width, or collapsed).
  // Held like a book it ends at the crease; flat, it is a half of the row less the gap.
  const [rowWidth, setRowWidth] = useState(0);
  const leftColumn = book ? Math.max(0, book.left - spacing.lg) : Math.max(0, (rowWidth - spacing.lg) / 2);
  const medium = family === 'medium';
  const { uid, profile } = useAuth();
  const unit = profile?.weightUnit ?? 'lb';
  const dist = profile?.distanceUnit ?? 'mi';
  const ins = useInsights();
  const { unreadCount } = useNotificationFeed();
  const openNotifications = () => (navigation as unknown as NavigationProp<AppStackParams>).navigate('NotificationsScreen');
  const home = useWorkoutHome();
  const steps = useSteps();
  const { buddies } = useBuddies();
  const buddyFeed = useBuddyActivity(buddies, 3);
  const buddyPlans = useBuddyPlans(buddies);
  const goBuddies = (screen: keyof BuddyRoutes) => (navigation as unknown as NavigationProp<BuddyRoutes>).navigate(screen as never);
  const scrollRef = useRef<React.ComponentRef<typeof ScrollView>>(null);
  useScrollToTop(scrollRef);
  const [refreshing, setRefreshing] = useState(false);
  const [streakInfo, setStreakInfo] = useState(false);
  // The cycle report: a card on top while it's unreviewed, and a one-time modal the first time the app opens after it lands.
  const reportCycle = home.cycleFinished && home.cycle && !home.reportReviewed ? home.cycle : null;
  const [reportModal, setReportModal] = useState(false);
  const promptedFor = useRef<string | null>(null);
  useEffect(() => {
    if (!reportCycle || reportCycle.reportPromptedAt || promptedFor.current === reportCycle.id) return;
    promptedFor.current = reportCycle.id;
    setReportModal(true);
  }, [reportCycle]);
  const openReport = () => {
    if (!home.cycle) return;
    setReportModal(false);
    (navigation as any).navigate('CycleReviewScreen', { cycleId: home.cycle.id });
  };
  const reportLater = () => {
    setReportModal(false);
    if (uid && home.cycle) markCycleReportPrompted(uid, home.cycle).catch(() => undefined);
  };
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([ins.refresh(), steps.refresh(), buddyFeed.refresh(), buddyPlans.refresh()]);
    } finally {
      setRefreshing(false);
    }
  }, [ins.refresh, steps.refresh, buddyFeed.refresh, buddyPlans.refresh]);

  useEffect(() => {
    if (__DEV__ && devFlags.seedBodyWeightIfEmpty && uid && !ins.loading && ins.weightEntries.length === 0) {
      seedSampleWeights(uid).catch(err => console.warn(err));
    }
  }, [uid, ins.loading, ins.weightEntries.length]);

  const fmtVolume = (kg: number) => compactNumber(unit === 'lb' ? kgToLb(kg) : kg);
  const goWorkout = () => (navigation as any).navigate('WorkoutStack');
  /** Opens a logged workout on the Workout tab, above its home screen. */
  const goSession = (sessionId: string, workoutName?: string) => (navigation as any).navigate('WorkoutStack', { screen: 'SessionDetailScreen', params: { sessionId, workoutName }, initial: false });

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
    askNotToday(uid, home.plan, home.cycle, todayOcc, home.todayDate, profile, fn => { fn().catch(err => console.warn(err)); });
  };
  // Nothing planned today and nothing done yet: offer a workout outside the plan.
  const canQuick = !!uid && !home.loading && !home.inProgressSession && !ins.todaySession && (!home.plan || !todayOcc || todayOcc.status !== 'scheduled');
  const quickWorkout = () => {
    if (!uid) return;
    startQuickSession(uid)
      .then(session => navigation.navigate('SessionScreen', { plan: null, cycle: null, session, activePlan: home.plan ? { plan: home.plan, cycle: home.cycle } : undefined }))
      .catch(err => console.warn('quick workout failed', err));
  };
  const todayStatus = !home.plan
    ? { tone: colors.inkMuted, kicker: 'Today', headline: 'No plan yet', detail: 'Set up a plan and your daily workout shows here.', action: 'Set up a plan' }
    : home.inProgressSession
      ? { tone: colors.accent, kicker: 'In progress', headline: home.inProgressSession.workoutName, detail: 'Pick up where you left off.', action: 'Resume' }
      : home.cycle && home.todayDate < home.cycle.startDate
        ? { tone: colors.inkMuted, kicker: home.cycle.number > 1 ? `Cycle ${home.cycle.number} starts` : 'Plan starts', headline: dateLabel(home.cycle.startDate), detail: home.upcoming[0] ? `First up: ${home.upcoming[0].workoutName}` : 'The cycle begins then.', action: 'Open' }
      : ins.todaySession
        ? { tone: colors.success, kicker: 'Done today', headline: ins.todaySession.workoutName, detail: `${countWorkingSets([ins.todaySession])} sets · ${fmtVolume(totalVolumeKg([ins.todaySession]))} ${unit} moved`, action: 'See workout' }
        : todayOcc && todayWorkout && todayOcc.status === 'scheduled'
          ? { tone: colors.accent, kicker: 'Today', headline: todayWorkout.name, detail: `${todayWorkout.exercises.length} exercises · not started`, action: 'Start' }
          : todayOcc && todayOcc.status === 'skipped'
            ? { tone: colors.error, kicker: 'Today', headline: `${todayOcc.workoutName} skipped`, detail: 'Skipped for this cycle.', action: 'Open' }
            : { tone: colors.inkMuted, kicker: 'Today', headline: 'Rest day', detail: home.upcoming[0] ? `Next: ${home.upcoming[0].workoutName} on ${shortDate(home.upcoming[0].date)}` : 'Nothing scheduled.', action: 'Open' };

  // The dashboard in pieces; the layout family arranges them below.
  const reportCard = (
            reportCycle && (
              <SurfaceCard tone="accent">
                <CustomText variant="overline" color={colors.accent}>Cycle {reportCycle.number}</CustomText>
                <CustomText variant="title">Your cycle report is ready</CustomText>
                <CustomText variant="caption" color={colors.inkMuted} style={{ marginBottom: spacing.md }}>Review it to see your stats and any changes to your next cycle.</CustomText>
                <PrimaryButton label="Review" onPress={openReport} />
              </SurfaceCard>
            )
  );
  const todayCard = (
            <TouchableOpacity onPress={ins.todaySession && !home.inProgressSession ? () => goSession(ins.todaySession!.id, ins.todaySession!.workoutName) : goWorkout} activeOpacity={0.7} style={medium ? { flex: 1 } : undefined}>
              <SurfaceCard tone={todayStatus.tone === colors.accent ? 'accent' : 'surface'} style={medium ? { flex: 1, justifyContent: 'center' } : undefined}>
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
                    {canQuick && (
                      <TouchableOpacity onPress={quickWorkout} hitSlop={8} accessibilityRole="button" style={{ alignSelf: 'flex-start', marginTop: spacing.sm }}>
                        <CustomText variant="label" color={colors.accent}>Still want to train? Quick workout</CustomText>
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

  );
  // Beside the today card (medium) the pair fills its height; a tile already fills its width.
  const tiles = (
            <View style={{ flexDirection: 'row', gap: spacing.sm, flex: medium ? 1 : undefined }}>
              <StatTile label="Streak" value={`${ins.streakDays}d`} delta={ins.streakDays > 0 ? 'Keep it going' : 'Train to start one'} onPress={() => setStreakInfo(true)} accessibilityLabel={`Streak ${ins.streakDays} days, what counts`} />
              <StatTile
                label="This week"
                value={String(ins.week.sessionsDone)}
                delta={ins.weekRemaining > 0 ? `${ins.week.sessionsDone === 1 ? 'workout' : 'workouts'} · ${ins.weekRemaining} more planned` : ins.week.sessionsDone === 1 ? 'workout' : 'workouts'}
              />
            </View>

  );
  const musclesCard = (
            <SurfaceCard>
              <CardHeader label="Muscles, last 30 days" action={ins.muscles30d.length > 0 ? 'All' : undefined} onAction={() => navigation.navigate('MusclesScreen')} />
              {ins.muscles30d.length > 0 ? (
                <View style={medium ? { flexDirection: 'row', alignItems: 'center', gap: spacing.lg } : undefined}>
                  <View style={{ alignItems: 'center', marginBottom: medium ? 0 : spacing.sm }}>
                    <MuscleMap primary={coverage.slice(0, 6)} secondary={coverage.slice(6)} height={170} />
                  </View>
                  <View style={medium ? { flex: 1 } : undefined}>
                  {ins.muscles30d.slice(0, 4).map((m, i) => (
                    <View key={m.muscle} style={{ borderTopWidth: i ? 1 : 0, borderTopColor: colors.line }}>
                      <MuscleRow muscle={m.muscle} sets={m.sets} max={maxSets} onPress={() => navigation.navigate('MuscleDetailScreen', { muscle: m.muscle })} />
                    </View>
                  ))}
                  {ins.muscles30d.length > 4 && (
                    <CustomText variant="caption" color={colors.inkMuted} style={{ marginTop: spacing.xs }}>+{ins.muscles30d.length - 4} more in All</CustomText>
                  )}
                  </View>
                </View>
              ) : (
                <CustomText variant="body" color={colors.inkMuted}>Finish a workout and your muscle coverage shows here.</CustomText>
              )}
            </SurfaceCard>

  );
  const volumeAndWeight = (
            <View style={{ flexDirection: 'row', gap: spacing.sm, alignItems: 'stretch' }}>
              <View style={{ flex: 1 }}>
                <LinkCard label="Volume" onPress={() => navigation.navigate('ProgressScreen')}>
                  <CustomText variant="display">{fmtVolume(ins.week.volumeKg)}</CustomText>
                  <CustomText variant="caption" color={colors.inkMuted}>{unit} this week</CustomText>
                  {/* No comparison until something is logged: "-100%" on a Monday says nothing. */}
                  <CustomText variant="caption" color={ins.week.volumeKg === 0 || ins.week.volumeChange === null ? colors.inkMuted : ins.week.volumeChange >= 0 ? colors.success : colors.error}>
                    {ins.week.volumeKg === 0 ? 'Nothing logged yet' : ins.week.volumeChange === null ? 'No last week yet' : `${ins.week.volumeChange >= 0 ? '+' : ''}${Math.round(ins.week.volumeChange * 100)}% vs last week`}
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

  );
  const recordsCard = (
            ins.recentRecords.length > 0 && (
              <SurfaceCard>
                <CardHeader label="Recent records" />
                {ins.recentRecords.map(pr => (
                  <TouchableOpacity
                    key={`${pr.exerciseId}-${pr.sessionId}`}
                    onPress={() => navigation.navigate('ExerciseProgressScreen', { exerciseId: pr.exerciseId, exerciseName: pr.exerciseName })}
                    style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.sm }}
                  >
                    <Icon icon={generalIcons.trophy} size={24} color={colors.warning} />
                    <View style={{ flex: 1 }}>
                      <CustomText variant="bodyStrong">{pr.exerciseName}</CustomText>
                      <CustomText variant="caption" color={colors.inkMuted}>{dateLabel(pr.date)}{pr.previousValue !== null ? ` · up from ${formatRecordValue(pr.kind, pr.previousValue, unit, dist)}` : ' · first record'}</CustomText>
                    </View>
                    <CustomText variant="bodyStrong" color={colors.accent}>{formatRecordValue(pr.kind, pr.value, unit, dist)}</CustomText>
                  </TouchableOpacity>
                ))}
              </SurfaceCard>
            )
  );
  const buddyActivityCard = (
            <LinkCard label="Buddy activity" onPress={() => goBuddies(buddies.length ? 'BuddyActivityScreen' : 'BuddiesScreen')}>
              {buddies.length === 0 ? (
                <CustomText variant="body" color={colors.inkMuted}>Add a buddy and their workouts, streaks and records show up here.</CustomText>
              ) : buddyFeed.items.length === 0 ? (
                <CustomText variant="body" color={colors.inkMuted}>Nothing yet. Finished workouts and streaks land here.</CustomText>
              ) : (
                buddyFeed.items.map(item => <ActivityRow key={item.id} item={item} compact />)
              )}
            </LinkCard>

  );
  const buddyPlansCard = (
            buddyPlans.plans.length > 0 && (
              <LinkCard label="Plans from buddies" onPress={() => goBuddies('BuddyPlansScreen')}>
                {buddyPlans.plans.slice(0, 3).map((sp, i) => (
                    <TouchableOpacity
                      key={`${sp.ownerUid}:${sp.plan.id}`}
                      onPress={() => (navigation as unknown as NavigationProp<BuddyRoutes>).navigate('BuddyPlanScreen', { ownerUid: sp.ownerUid, planId: sp.plan.id, ownerName: sp.ownerName })}
                      style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.sm, borderTopWidth: i ? 1 : 0, borderTopColor: colors.line }}
                    >
                      <Avatar uri={sp.ownerPhoto} name={sp.ownerName} size={32} />
                      <View style={{ flex: 1 }}>
                        <CustomText variant="body" numberOfLines={1}>{sp.plan.name}</CustomText>
                        <CustomText variant="caption" color={colors.inkMuted} numberOfLines={1}>by {sp.ownerName ?? 'a buddy'} · {sp.plan.workouts.length} workout{sp.plan.workouts.length === 1 ? '' : 's'}</CustomText>
                      </View>
                    </TouchableOpacity>
                ))}
              </LinkCard>
            )
  );
  const stepsCard = (
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
                    steps.error ? (
                      <>
                        <CustomText variant="body" color={colors.inkMuted}>
                          {steps.platformName} isn't sharing steps right now. That can happen after reinstalling the app or a system update. Reconnect to pick it back up.
                        </CustomText>
                        <View style={{ marginTop: spacing.md }}>
                          <PrimaryButton label={`Reconnect ${steps.platformName}`} icon={generalIcons.personRunning} onPress={() => steps.connect()} />
                        </View>
                      </>
                    ) : (
                      <CustomText variant="caption" color={colors.inkMuted}>
                        No step data yet. If you declined access, allow it in {steps.platformName} settings.
                      </CustomText>
                    )
                  )}
                </>
              )}
            </SurfaceCard>

  );

  return (
    <SafeAreaView edges={['left', 'right']} style={{ flex: 1, backgroundColor: colors.ground }}>
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={{ padding: spacing.lg, paddingTop: headerHeight + spacing.sm, gap: spacing.lg, paddingBottom: bottomRoom + bottomInset }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} progressViewOffset={headerHeight} />}
      >
        {/* One scroll view for every state; the title row scrolls with the content. */}
        {loading && <ActivityIndicator color={colors.accent} style={{ marginTop: spacing.xxl }} />}
        {!loading && family === 'phone' && (
          <>
            {reportCard}
            <SectionHeader label="Today" first={!reportCycle} />
            {todayCard}
            {tiles}
            <SectionHeader label="Progress" />
            {musclesCard}
            {volumeAndWeight}
            {recordsCard}
            <SectionHeader label="Buddies" />
            {buddyActivityCard}
            {buddyPlansCard}
            <SectionHeader label="Activity" />
            {stepsCard}
          </>
        )}
        {/* Two columns: today and buddies beside progress and activity. */}
        {!loading && family === 'wide' && (
          <>
            {reportCard}
            {/* Each column is as tall as its own cards; nothing in it grows to match the other. */}
            <View style={{ flexDirection: 'row', gap: book?.gap ?? spacing.lg, alignItems: 'flex-start' }} onLayout={e => setRowWidth(e.nativeEvent.layout.width)}>
              <View style={{ width: leftColumn, flexGrow: 0, flexShrink: 0, gap: spacing.lg, alignSelf: 'flex-start' }}>
                <SectionHeader label="Today" first />
                {todayCard}
                {tiles}
                <SectionHeader label="Buddies" />
                {buddyActivityCard}
                {buddyPlansCard}
              </View>
              <View style={{ flex: 1, gap: spacing.lg, alignSelf: 'flex-start' }}>
                <SectionHeader label="Progress" first />
                {musclesCard}
                {volumeAndWeight}
                {recordsCard}
                <SectionHeader label="Activity" />
                {stepsCard}
              </View>
            </View>
          </>
        )}
        {/* One column, cards gone wide: today beside its tiles, the muscle map beside its rows. */}
        {!loading && family === 'medium' && (
          <>
            {reportCard}
            <SectionHeader label="Today" first={!reportCycle} />
            <View style={{ flexDirection: 'row', gap: spacing.sm, alignItems: 'stretch' }}>
              <View style={{ flex: 1.4 }}>{todayCard}</View>
              <View style={{ flex: 1 }}>{tiles}</View>
            </View>
            <SectionHeader label="Progress" />
            {musclesCard}
            {volumeAndWeight}
            {recordsCard}
            <SectionHeader label="Buddies" />
            {buddyActivityCard}
            {buddyPlansCard}
            <SectionHeader label="Activity" />
            {stepsCard}
          </>
        )}
      </ScrollView>
      <StickyTabHeader title="Home" action={{ icon: generalIcons.bell, badge: unreadCount > 0, accessibilityLabel: 'Notifications', onPress: openNotifications }} onHeight={setHeaderHeight} />

      <BottomSheet open={streakInfo} title="Your streak" onClose={() => setStreakInfo(false)}>
        <View style={{ gap: spacing.md }}>
          <CustomText variant="body">A streak tracks the days in a row with a finished workout.</CustomText>
          <CustomText variant="body" color={colors.inkMuted}>A day with nothing logged, including a rest day, ends it, so a walk in the park or a run on the treadmill will keep your streak going.</CustomText>
        </View>
      </BottomSheet>
      <CycleReportModal open={reportModal} cycleNumber={home.cycle?.number ?? 0} onReview={() => { if (uid && home.cycle) markCycleReportPrompted(uid, home.cycle).catch(() => undefined); openReport(); }} onLater={reportLater} />
    </SafeAreaView>
  );
};
