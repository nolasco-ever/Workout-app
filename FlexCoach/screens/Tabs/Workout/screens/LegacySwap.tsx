import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, TouchableOpacity, View } from 'react-native';
import { RouteProp, useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SafeAreaView } from '../../../../components/layout/SafeAreaView';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../../../data/auth/AuthProvider';
import { MeasurementType, Session } from '../../../../data/models';
import { sessionRepository } from '../../../../data/repositories/sessionRepository';
import { catalogName, getCatalogExercise } from '../../../../data/catalog/exerciseCatalog';
import { SwappableExercise, swapReach, swappableExercises } from '../../../../data/engine/legacySwap';
import { performLegacySwap, undoLegacySwap, WorkoutInProgressError } from '../../../../data/services/legacySwapService';
import { useWorkoutHome } from '../../../../data/hooks/useWorkoutHome';
import { CustomText } from '../../../../components/text/customText';
import { subscribeSwap } from '../components/swapChannel';
import { PrimaryButton } from '../../../../components/buttons/PrimaryButton';
import { SurfaceCard as Card } from '../../../../components/cards/SurfaceCard';
import { MuscleMap } from '../../../../components/anatomy/MuscleMap';
import { Icon } from '../../../../components/icons/Icon';
import { directionIcons, generalIcons } from '../../../../components/icons/icon-library';
import { useComfortableColumn } from '../../../../components/layout/useComfortableColumn';
import { useTheme } from '../../../../theme';
import type { AppStackParams } from '../../../../appNavigators/AppStack';

/**
 * Legacy Swap (v1 #6b, designed on the FlexCoach canvas 2026-10-26): a
 * temporary flow for testers whose exercises were matched wrong by the move
 * to the new exercise library. Intro, then pick the exercise, pick the one
 * actually done in the workout's swap picker (both libraries; owner
 * 2026-10-27), confirm (with the active plan's question), done, with every
 * swap listed for Undo. The plan creator is left
 * alone; history moves for the exercise everywhere.
 */
export type LegacySwapRoutes = {
  LegacySwapScreen: undefined;
  LegacySwapPickScreen: undefined;
  /** `measurement` is how the history was logged; a pick tracked another way can't take it. */
  LegacySwapConfirmScreen: { key: string; fromId: string; fromName: string; measurement: MeasurementType; toId: string; inActivePlan: boolean };
  /** Without a name, "Swaps you've made" alone. */
  LegacySwapDoneScreen: { swappedTo?: string; detail?: string } | undefined;
};

/** The flow sits in the root stack, over the tabs, so the tab bar never covers its buttons (owner 2026-10-27). */
type Nav = NativeStackNavigationProp<AppStackParams>;

/** The picker hands its pick back tagged with this and the exercise's key; a running workout has no exercise by that id, so it ignores it. */
const PICK_TAG = 'legacy-swap:';

const MEASURED: Record<MeasurementType, string> = {
  weight_reps: 'weight and reps',
  reps: 'reps',
  time: 'time',
  distance_time: 'distance and time',
};

/** Every session, once per screen: the history the swap moves. */
const useHistory = (): Session[] | null => {
  const { uid } = useAuth();
  const [history, setHistory] = useState<Session[] | null>(null);
  useEffect(() => {
    if (!uid) return;
    let cancelled = false;
    sessionRepository
      .listCompleted(uid)
      .then(h => !cancelled && setHistory(h))
      .catch(() => !cancelled && setHistory([]));
    return () => {
      cancelled = true;
    };
  }, [uid]);
  return history;
};

/** The step's number and question, at the top of steps 1 and 2. */
const StepHeading = ({ step, title, text }: { step: number; title: string; text?: string }) => {
  const { colors, spacing } = useTheme();
  return (
    <View style={{ gap: spacing.xs }}>
      <CustomText variant="overline" color={colors.accent}>Step {step} of 2</CustomText>
      <CustomText variant="title">{title}</CustomText>
      {text ? <CustomText variant="body" color={colors.inkMuted}>{text}</CustomText> : null}
    </View>
  );
};

/**
 * One exercise in a list: its muscle map, name and a line under it, then a chevron or a pick mark. The info
 * button opens its How to, to check it is the right one (owner 2026-10-27), as in the exercise picker.
 */
const ExerciseLine = ({ exerciseId, name, detail, onPress, picked, first }: { exerciseId: string; name: string; detail: string; onPress: () => void; picked?: boolean; first: boolean }) => {
  const navigation = useNavigation<Nav>();
  const { colors, spacing } = useTheme();
  const ex = getCatalogExercise(exerciseId);
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', borderTopWidth: first ? 0 : 1, borderTopColor: colors.line, backgroundColor: picked ? colors.accentTint : colors.transparent }}>
      <TouchableOpacity
        onPress={onPress}
        accessibilityRole="button"
        accessibilityState={picked === undefined ? undefined : { selected: picked }}
        style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.sm, paddingLeft: spacing.md, minHeight: 68 }}
      >
        {ex ? <MuscleMap primary={ex.primaryMuscles} secondary={ex.secondaryMuscles} height={48} views="auto" /> : <View style={{ width: 48, height: 48 }} />}
        <View style={{ flex: 1 }}>
          <CustomText variant="bodyStrong" numberOfLines={2}>{name}</CustomText>
          <CustomText variant="caption" color={colors.inkMuted} numberOfLines={3}>{detail}</CustomText>
        </View>
      </TouchableOpacity>
      {ex && (
        <TouchableOpacity
          onPress={() => navigation.navigate('ExerciseDetailScreen', { exerciseId })}
          accessibilityRole="button"
          accessibilityLabel={`Preview ${name}`}
          hitSlop={{ top: 8, bottom: 8 }}
          style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}
        >
          <Icon icon={generalIcons.info} size={20} color={colors.inkMuted} />
        </TouchableOpacity>
      )}
      <TouchableOpacity onPress={onPress} accessible={false} importantForAccessibility="no" style={{ paddingRight: spacing.md, paddingLeft: spacing.xs, minHeight: 68, justifyContent: 'center' }}>
        {picked === undefined ? (
          <Icon icon={directionIcons.angleRight} size={18} color={colors.inactive} />
        ) : (
          <View style={{ width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: picked ? colors.accent : colors.transparent, borderWidth: picked ? 0 : 2, borderColor: colors.line }}>
            {picked && <Icon icon={generalIcons.check} size={14} color={colors.onAccent} strokeWidth={3} />}
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
};

/** The bottom of a step: its button, clear of the home indicator. */
const Footer = ({ children }: { children: React.ReactNode }) => {
  const { spacing } = useTheme();
  const insets = useSafeAreaInsets();
  return <View style={{ padding: spacing.lg, paddingBottom: spacing.lg + insets.bottom, gap: spacing.sm }}>{children}</View>;
};

/** Why this exists and how it works. */
export const LegacySwapScreen = () => {
  const navigation = useNavigation<Nav>();
  const { colors, spacing } = useTheme();
  const column = useComfortableColumn();
  const { profile } = useAuth();
  const swaps = profile?.legacySwaps?.length ?? 0;
  const steps = ["Pick an exercise you've logged, then the one you actually do, from either library.", 'Confirm. Your past workouts and records switch to it.'];
  return (
    <SafeAreaView edges={['left', 'right']} style={{ flex: 1, backgroundColor: colors.ground }}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[{ padding: spacing.lg, gap: spacing.lg }, column]}>
        <View style={{ gap: spacing.md }}>
          <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: colors.accentTint, alignItems: 'center', justifyContent: 'center' }}>
            <Icon icon={generalIcons.swap} size={28} color={colors.accent} />
          </View>
          <CustomText variant="title">Fix how your exercises were matched</CustomText>
          <CustomText variant="body" color={colors.inkMuted}>
            We moved FlexCoach to a new exercise library. Each exercise you had was automatically matched to the closest one in the new library.
          </CustomText>
          <CustomText variant="body" color={colors.inkMuted}>
            Some of those matches aren't quite right, so both libraries now live in the app. If an exercise was matched wrong, swap it for the one you actually do. All of its history carries over to the new exercise, so nothing is lost.
          </CustomText>
        </View>
        <Card style={{ gap: spacing.md }}>
          <CustomText variant="overline" color={colors.inkMuted}>How it works</CustomText>
          {steps.map((text, i) => (
            <View key={text} style={{ flexDirection: 'row', gap: spacing.md, alignItems: 'flex-start' }}>
              <View style={{ width: 26, height: 26, borderRadius: 13, backgroundColor: colors.surfaceRaised, alignItems: 'center', justifyContent: 'center' }}>
                <CustomText variant="label">{i + 1}</CustomText>
              </View>
              <CustomText variant="body" style={{ flex: 1, paddingTop: 2 }}>{text}</CustomText>
            </View>
          ))}
        </Card>
        <View style={{ flexDirection: 'row', gap: spacing.sm, padding: spacing.md, borderRadius: 16, backgroundColor: colors.accentTint }}>
          <Icon icon={generalIcons.clock} size={18} color={colors.accent} />
          <CustomText variant="caption" style={{ flex: 1 }}>Legacy Swap is temporary and will be removed in a future build. You can undo any swap while it's here.</CustomText>
        </View>
      </ScrollView>
      <Footer>
        <PrimaryButton label="Get started" onPress={() => navigation.navigate('LegacySwapPickScreen')} />
        {swaps > 0 && <PrimaryButton label={`Swaps you've made (${swaps})`} variant="quiet" onPress={() => navigation.navigate('LegacySwapDoneScreen', undefined)} />}
      </Footer>
    </SafeAreaView>
  );
};

/** Step 1: which exercise was matched wrong. Only exercises with logged sets: one with no history has nothing to swap. */
export const LegacySwapPickScreen = () => {
  const navigation = useNavigation<Nav>();
  const { colors, spacing } = useTheme();
  const column = useComfortableColumn();
  const history = useHistory();
  const { plan } = useWorkoutHome();
  const insets = useSafeAreaInsets();
  const all = useMemo(() => (history ? swappableExercises(history, plan, catalogName) : null), [history, plan]);
  // The pick comes back from the workout's swap picker, which closes itself after; confirm opens once this screen is back in front.
  const choosing = useRef<SwappableExercise | null>(null);
  const picked = useRef<string | null>(null);
  useEffect(
    () =>
      subscribeSwap((tag, exercise) => {
        if (choosing.current && tag === `${PICK_TAG}${choosing.current.key}`) picked.current = exercise.id;
      }),
    [],
  );
  useFocusEffect(
    useCallback(() => {
      const from = choosing.current;
      const toId = picked.current;
      choosing.current = null;
      picked.current = null;
      if (from && toId) navigation.navigate('LegacySwapConfirmScreen', { key: from.key, fromId: from.exerciseId, fromName: from.name, measurement: from.measurement, toId, inActivePlan: from.inActivePlan });
    }, [navigation]),
  );
  const choose = (e: SwappableExercise) => {
    choosing.current = e;
    navigation.navigate('ExercisePickerScreen', { mode: 'swap', sessionExerciseId: `${PICK_TAG}${e.key}`, exerciseId: e.exerciseId, excludeIds: [] });
  };
  return (
    <SafeAreaView edges={['left', 'right']} style={{ flex: 1, backgroundColor: colors.ground }}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[{ padding: spacing.lg, paddingBottom: spacing.xl + insets.bottom, gap: spacing.md }, column]}>
        <StepHeading step={1} title="Which exercise was matched wrong?" text="Every exercise you've logged sets for. Tap the info button to preview one." />
        {!all ? (
          <ActivityIndicator color={colors.accent} style={{ marginTop: spacing.xl }} />
        ) : all.length === 0 ? (
          <CustomText variant="body" color={colors.inkMuted} centered style={{ marginTop: spacing.lg }}>You haven't logged any exercises yet.</CustomText>
        ) : (
          <Card style={{ padding: 0, overflow: 'hidden' }}>
            {all.map((e, i) => (
              <ExerciseLine
                key={e.key}
                first={i === 0}
                exerciseId={e.exerciseId}
                name={e.name}
                detail={[`Logged ${e.workouts} time${e.workouts === 1 ? '' : 's'}`, e.inActivePlan && plan ? `in ${plan.name}` : null].filter(Boolean).join(' · ')}
                onPress={() => choose(e)}
              />
            ))}
          </Card>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

/** Step 2: from, to, what carries over, and the active plan's question. A pick tracked another way can't take the history. */
export const LegacySwapConfirmScreen = () => {
  const navigation = useNavigation<Nav>();
  const { params } = useRoute<RouteProp<AppStackParams, 'LegacySwapConfirmScreen'>>();
  const { colors, spacing, radius } = useTheme();
  const column = useComfortableColumn();
  const { uid, profile } = useAuth();
  const { plan, inProgressSession } = useWorkoutHome();
  const history = useHistory();
  const to = getCatalogExercise(params.toId);
  const reach = useMemo(() => (history ? swapReach(history, params.key) : null), [history, params.key]);
  const [replace, setReplace] = useState(true);
  const [busy, setBusy] = useState(false);
  if (!to) return null;
  const fits = to.measurement === params.measurement;

  const swap = async () => {
    if (!uid || busy || !fits) return;
    if (inProgressSession) {
      Alert.alert('A workout is going', 'Finish or leave it first, then swap.');
      return;
    }
    setBusy(true);
    try {
      const replaceInPlan = params.inActivePlan && replace;
      await performLegacySwap({ uid, profile, key: params.key, from: { id: params.fromId, name: params.fromName }, to, activePlan: plan, replaceInPlan });
      const counts = reach ? `${reach.workouts} workout${reach.workouts === 1 ? '' : 's'} and ${reach.records} record${reach.records === 1 ? '' : 's'} now show under ${to.name}` : `Your history now shows under ${to.name}`;
      navigation.navigate('LegacySwapDoneScreen', { swappedTo: to.name, detail: replaceInPlan && plan ? `${counts}, and ${plan.name} uses it.` : `${counts}.` });
    } catch (err) {
      if (err instanceof WorkoutInProgressError) Alert.alert('A workout is going', 'Finish or leave it first, then swap.');
      else {
        console.warn('legacy swap failed', err);
        Alert.alert("Couldn't swap", 'Nothing was changed. Check your connection and try again.');
      }
    } finally {
      setBusy(false);
    }
  };

  const side = (label: string, name: string, exerciseId: string, now: boolean) => {
    const ex = getCatalogExercise(exerciseId);
    return (
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md, borderRadius: radius.lg, backgroundColor: now ? colors.accentTint : colors.surface, borderWidth: now ? 1.5 : 1, borderColor: now ? colors.accent : colors.line }}>
        {ex ? <MuscleMap primary={ex.primaryMuscles} secondary={ex.secondaryMuscles} height={48} views="auto" /> : <View style={{ width: 48, height: 48 }} />}
        <View style={{ flex: 1 }}>
          <CustomText variant="overline" color={now ? colors.accent : colors.inkMuted}>{label}</CustomText>
          <CustomText variant="bodyStrong" color={now ? colors.ink : colors.inkMuted} style={now ? undefined : { textDecorationLine: 'line-through' }}>{name}</CustomText>
        </View>
      </View>
    );
  };
  const choice = (yes: boolean, title: string, text: string) => (
    <TouchableOpacity
      accessibilityRole="radio"
      accessibilityState={{ checked: replace === yes }}
      onPress={() => setReplace(yes)}
      style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, minHeight: 56, padding: spacing.md, borderRadius: radius.md, backgroundColor: replace === yes ? colors.accentTint : colors.surfaceRaised, borderWidth: 1.5, borderColor: replace === yes ? colors.accent : colors.transparent }}
    >
      <View style={{ width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: replace === yes ? colors.accent : colors.inkMuted, alignItems: 'center', justifyContent: 'center' }}>
        {replace === yes && <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: colors.accent }} />}
      </View>
      <View style={{ flex: 1 }}>
        <CustomText variant="bodyStrong">{title}</CustomText>
        <CustomText variant="caption" color={colors.inkMuted}>{text}</CustomText>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView edges={['left', 'right']} style={{ flex: 1, backgroundColor: colors.ground }}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[{ padding: spacing.lg, gap: spacing.lg }, column]}>
        <StepHeading step={2} title="Swap and carry over the history?" />
        <View style={{ gap: spacing.sm }}>
          {side('From', params.fromName, params.fromId, false)}
          <View style={{ alignItems: 'center' }}>
            <Icon icon={directionIcons.angleDown} size={22} color={colors.accent} />
          </View>
          {side('To', to.name, to.id, true)}
        </View>
        <Card style={{ gap: spacing.md }}>
          <CustomText variant="overline" color={colors.inkMuted}>What carries over</CustomText>
          {reach ? (
            <View style={{ flexDirection: 'row', gap: spacing.lg }}>
              <View style={{ flex: 1 }}>
                <CustomText variant="title">{reach.workouts}</CustomText>
                <CustomText variant="caption" color={colors.inkMuted}>workout{reach.workouts === 1 ? '' : 's'}</CustomText>
              </View>
              <View style={{ flex: 1 }}>
                <CustomText variant="title">{reach.records}</CustomText>
                <CustomText variant="caption" color={colors.inkMuted}>record{reach.records === 1 ? '' : 's'}</CustomText>
              </View>
            </View>
          ) : (
            <ActivityIndicator color={colors.accent} />
          )}
          <View style={{ height: 1, backgroundColor: colors.line }} />
          <CustomText variant="body" color={colors.inkMuted}>
            Every past workout, record and chart for {params.fromName} moves to {to.name}, so your targets pick up right where you left off.
          </CustomText>
        </Card>
        {!fits && (
          <View style={{ flexDirection: 'row', gap: spacing.sm, padding: spacing.md, borderRadius: radius.lg, backgroundColor: colors.errorTint }}>
            <Icon icon={generalIcons.info} size={18} color={colors.error} />
            <CustomText variant="body" style={{ flex: 1 }}>
              Your {params.fromName} sets are logged with {MEASURED[params.measurement]}, and {to.name} tracks {MEASURED[to.measurement]}, so the history wouldn't fit. Go back and pick one tracked with {MEASURED[params.measurement]}.
            </CustomText>
          </View>
        )}
        {fits && params.inActivePlan && plan && (
          <Card style={{ gap: spacing.sm }}>
            <CustomText variant="bodyStrong">
              {params.fromName} is in your active plan, {plan.name}. Replace it there with {to.name}?
            </CustomText>
            <View accessibilityRole="radiogroup" style={{ gap: spacing.sm }}>
              {choice(true, `Yes, use ${to.name} in the plan`, 'Same sets, reps and rest as now')}
              {choice(false, 'No, keep the plan as it is', `${params.fromName} starts fresh, with no history`)}
            </View>
          </Card>
        )}
      </ScrollView>
      <Footer>
        <PrimaryButton label="Swap exercise" icon={generalIcons.swap} busy={busy} disabled={!fits} onPress={swap} />
        <CustomText variant="caption" color={colors.inkMuted} centered>You can undo this from Legacy Swap.</CustomText>
      </Footer>
    </SafeAreaView>
  );
};

/** Done, and every swap made, each with Undo. Opened without a name, it is the list alone. */
export const LegacySwapDoneScreen = () => {
  const navigation = useNavigation<Nav>();
  const { params } = useRoute<RouteProp<AppStackParams, 'LegacySwapDoneScreen'>>();
  const { colors, spacing } = useTheme();
  const column = useComfortableColumn();
  const { uid, profile } = useAuth();
  const { inProgressSession } = useWorkoutHome();
  const [undoing, setUndoing] = useState<string | null>(null);
  const swaps = [...(profile?.legacySwaps ?? [])].reverse();
  const when = (at: number) => {
    const d = new Date(at);
    return d.toDateString() === new Date().toDateString() ? 'today' : d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };
  const undo = (id: string, name: string) =>
    Alert.alert(`Undo the swap to ${name}?`, 'Its history goes back where it was, and the plan too if it was changed.', [
      { text: 'Keep', style: 'cancel' },
      {
        text: 'Undo',
        style: 'destructive',
        onPress: async () => {
          if (!uid) return;
          if (inProgressSession) {
            Alert.alert('A workout is going', 'Finish or leave it first, then undo.');
            return;
          }
          setUndoing(id);
          try {
            await undoLegacySwap(uid, profile, id);
          } catch (err) {
            console.warn('legacy swap undo failed', err);
            Alert.alert("Couldn't undo", 'Nothing was changed. Check your connection and try again.');
          } finally {
            setUndoing(null);
          }
        },
      },
    ]);
  // Back to the Workout tab, past the steps.
  const finish = () => navigation.popToTop();
  return (
    <SafeAreaView edges={['left', 'right']} style={{ flex: 1, backgroundColor: colors.ground }}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[{ padding: spacing.lg, gap: spacing.lg }, column]}>
        {params?.swappedTo && (
          <View style={{ alignItems: 'center', gap: spacing.sm, paddingTop: spacing.lg }}>
            <View style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: colors.successTint, alignItems: 'center', justifyContent: 'center' }}>
              <Icon icon={generalIcons.check} size={36} color={colors.success} strokeWidth={3} />
            </View>
            <CustomText variant="title" centered>Swapped to {params.swappedTo}</CustomText>
            {params.detail ? <CustomText variant="body" color={colors.inkMuted} centered>{params.detail}</CustomText> : null}
          </View>
        )}
        <View style={{ gap: spacing.sm }}>
          <CustomText variant="overline" color={colors.inkMuted}>Swaps you've made</CustomText>
          {swaps.length === 0 ? (
            <CustomText variant="body" color={colors.inkMuted}>None yet.</CustomText>
          ) : (
            <Card style={{ padding: 0, overflow: 'hidden' }}>
              {swaps.map((s, i) => (
                <View key={s.id} style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md, borderTopWidth: i ? 1 : 0, borderTopColor: colors.line }}>
                  <View style={{ flex: 1 }}>
                    <CustomText variant="bodyStrong">{s.to.name}</CustomText>
                    <CustomText variant="caption" color={colors.inkMuted}>Was {s.from.name} · {when(s.at)}</CustomText>
                  </View>
                  <View style={{ width: 96 }}>
                    <PrimaryButton label="Undo" variant="outline" busy={undoing === s.id} disabled={undoing !== null} onPress={() => undo(s.id, s.to.name)} />
                  </View>
                </View>
              ))}
            </Card>
          )}
          <CustomText variant="caption" color={colors.inkMuted}>Undo puts the history back, and the plan if it was changed.</CustomText>
        </View>
      </ScrollView>
      <Footer>
        <PrimaryButton label="Swap another exercise" variant="outline" onPress={() => navigation.navigate('LegacySwapPickScreen')} />
        <PrimaryButton label="Done" onPress={finish} />
      </Footer>
    </SafeAreaView>
  );
};
