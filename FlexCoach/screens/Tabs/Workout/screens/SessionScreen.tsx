import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Alert, AppState, ScrollView, TouchableOpacity, Vibration, View } from 'react-native';
import { KeyboardAvoiding } from '../../../../components/layout/KeyboardAvoiding';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RouteProp, useIsFocused, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '../../../../data/auth/AuthProvider';
import { LoggedSet, Session, SessionExercise } from '../../../../data/models';
import { findWorkout } from '../../../../data/engine/schedule';
import { newId } from '../../../../data/engine/ids';
import { getCatalogExercise } from '../../../../data/catalog/exerciseCatalog';
import { abandonSession, addSetTo, addWarmupSetTo, finishSession, logSet, removeSetFrom, saveSets } from '../../../../data/services/workoutService';
import { warmupRestSec } from '../../../../data/engine/progression';
import { planRestOverNotification, withPrefDefaults } from '../../../../data/engine/notifications';
import { cancelRestOver, scheduleRestOver } from '../../../../data/notifications/notificationService';
import { showInAppBanner } from '../../../../data/notifications/inAppBanner';
import { CustomText } from '../../../../components/text/customText';
import { Icon } from '../../../../components/icons/Icon';
import { directionIcons, generalIcons } from '../../../../components/icons/icon-library';
import { useTheme } from '../../../../theme';
import { WorkoutStackParams } from '../WorkoutStack';
import { useTabBarInset } from '../../../../navigation/useTabBarInset';
import { PrimaryButton } from '../../../../components/buttons/PrimaryButton';
import { MuscleMap } from '../../../../components/anatomy/MuscleMap';
import { RestRing, SessionTitle } from '../components/SessionHeader';
import { SetDraft, SetRow } from '../components/SetRow';
import { SwipeToDelete } from '../../../../components/list-items/SwipeToDelete';
import Animated, { SlideInLeft, SlideInRight } from 'react-native-reanimated';
import { fromDraft, toDraft, Units, unitLabels } from '../components/setDrafts';

export const SessionScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<WorkoutStackParams>>();
  const { params } = useRoute<RouteProp<WorkoutStackParams, 'SessionScreen'>>();
  const { plan, cycle } = params;
  const { colors, spacing, radius } = useTheme();
  const tabBarInset = useTabBarInset();
  const { uid, profile } = useAuth();
  const units: Units = { weight: profile?.weightUnit ?? 'lb', distance: profile?.distanceUnit ?? 'mi' };

  const [session, setSession] = useState<Session>(params.session);
  const sessionRef = useRef(session);
  sessionRef.current = session;
  const [index, setIndex] = useState(() => {
    const firstOpen = params.session.exercises.findIndex(ex => ex.sets.some(s => !s.completed));
    return firstOpen === -1 ? 0 : firstOpen;
  });
  const [drafts, setDrafts] = useState<Record<string, SetDraft>>(() => {
    const d: Record<string, SetDraft> = {};
    for (const ex of params.session.exercises) for (const s of ex.sets) d[s.id] = toDraft(ex, s, units);
    return d;
  });
  /** Which way the last exercise change went, so the new one slides in from that side. */
  const slideDir = useRef<1 | -1>(1);
  const goTo = (next: number) => {
    slideDir.current = next > index ? 1 : -1;
    setRestStartedAt(null);
    setIndex(next);
  };
  const [restStartedAt, setRestStartedAt] = useState<number | null>(null);
  /** Length of the rest that is running: shorter after a warm-up set. */
  const [restFor, setRestFor] = useState(90);
  const [finishing, setFinishing] = useState(false);

  const exercise = session.exercises[index];
  const workoutEntry = findWorkout(plan, session.workoutId)?.exercises.find(e => e.id === exercise.workoutExerciseId);
  const restSec = workoutEntry?.restSec ?? 90;
  const catalog = getCatalogExercise(exercise.exerciseId);
  const total = session.exercises.length;
  const completedSets = useMemo(() => session.exercises.reduce((n, ex) => n + ex.sets.filter(s => s.completed).length, 0), [session]);
  const totalSets = useMemo(() => session.exercises.reduce((n, ex) => n + ex.sets.length, 0), [session]);

  // Leaving the screen keeps the session in progress; Home offers Resume.
  useEffect(() => {
    return navigation.addListener('beforeRemove', e => {
      if (finishing) return;
      e.preventDefault();
      Alert.alert('Leave workout?', 'Your sets are saved. You can resume from the Workout tab.', [
        { text: 'Stay', style: 'cancel' },
        { text: 'Leave', onPress: () => navigation.dispatch(e.data.action) },
        {
          text: 'Discard workout',
          style: 'destructive',
          onPress: async () => {
            if (uid) await abandonSession(uid, sessionRef.current, cycle);
            navigation.dispatch(e.data.action);
          },
        },
      ]);
    });
  }, [navigation, finishing, uid, cycle]);

  const persist = async (ex: SessionExercise, set: LoggedSet) => {
    const next: Session = {
      ...session,
      exercises: session.exercises.map(e => (e.id === ex.id ? { ...e, sets: e.sets.map(s => (s.id === set.id ? set : s)) } : e)),
    };
    setSession(next);
    if (uid) logSet(uid, next, ex.id, set).catch(err => console.warn('logSet failed', err));
  };

  const toggleDone = (set: LoggedSet) => {
    const merged = fromDraft(exercise, set, drafts[set.id], units);
    const done = !set.completed;
    persist(exercise, { ...merged, completed: done, completedAt: done ? Date.now() : null });
    // No rest after the workout's final set: there is nothing left to rest for.
    const workoutDone = done && index === session.exercises.length - 1 && exercise.sets.every(s => s.id === set.id || s.completed);
    setRestFor(set.warmup ? warmupRestSec(restSec) : restSec);
    setRestStartedAt(done && !workoutDone ? Date.now() : null);
  };

  const addWarmupSet = () => {
    const { session: next, set } = addWarmupSetTo(session, exercise.id, units.weight, newId);
    setSession(next);
    setDrafts(d => ({ ...d, [set.id]: toDraft(exercise, set, units) }));
    if (uid) saveSets(uid, next, exercise.id).catch(err => console.warn('addWarmupSet failed', err));
  };

  const addSet = () => {
    const { session: next, set } = addSetTo(session, exercise.id, newId);
    setSession(next);
    setDrafts(d => ({ ...d, [set.id]: toDraft(exercise, set, units) }));
    if (uid) saveSets(uid, next, exercise.id).catch(err => console.warn('addSet failed', err));
  };

  // Any set can be swiped away, down to the last one. Removing a completed
  // set also takes it out of the count and the volume.
  const removeSet = (set: LoggedSet) => {
    if (exercise.sets.length <= 1) return;
    const next = removeSetFrom(session, exercise.id, set.id);
    setSession(next);
    if (uid) saveSets(uid, next, exercise.id).catch(err => console.warn('removeSet failed', err));
  };

  const finish = async () => {
    if (!uid) return;
    if (completedSets === 0) {
      Alert.alert('Nothing logged yet', 'Mark at least one set done before finishing.');
      return;
    }
    setFinishing(true);
    try {
      const result = await finishSession(uid, profile, session, cycle);
      navigation.replace('SessionCompleteScreen', { result });
    } catch (err) {
      console.warn(err);
      setFinishing(false);
    }
  };

  const isLast = index === total - 1;

  // The header carries the running clock and the rest ring, so neither
  // takes room from the set rows.
  const dismissRest = () => setRestStartedAt(null);
  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: () => <SessionTitle name={session.workoutName} startedAt={session.startedAt} />,
      headerRight: () => <RestRing startedAt={restStartedAt} durationSec={restFor} onDismiss={dismissRest} />,
    });
    // dismissRest is a stable setter.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigation, session.workoutName, session.startedAt, restStartedAt, restFor]);

  // While the app is in front, the rest timer is handled here: this screen
  // counts down in its own strip, any other screen gets an in-app banner,
  // and the phone buzzes either way. The system notification is only
  // scheduled for the time the app spends in the background, so it never
  // doubles up with what is on screen.
  const restOverWanted = withPrefDefaults(profile?.notifications);
  const restOverEnabled = restOverWanted.enabled && restOverWanted.restOver;
  const focused = useIsFocused();
  const focusedRef = useRef(focused);
  focusedRef.current = focused;
  const [appState, setAppState] = useState(AppState.currentState);
  useEffect(() => {
    const sub = AppState.addEventListener('change', setAppState);
    return () => sub.remove();
  }, []);
  const inBackground = appState !== 'active';

  useEffect(() => {
    if (restStartedAt === null || !restOverEnabled || !inBackground) {
      cancelRestOver().catch(() => undefined);
      return;
    }
    scheduleRestOver(planRestOverNotification(restStartedAt, restFor, session.id, exercise.exerciseName)).catch(err => console.warn('rest timer notification failed', err));
    // exercise.exerciseName only changes with `index`, which also resets the timer.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [restStartedAt, restFor, session.id, restOverEnabled, inBackground]);
  useEffect(() => () => {
    cancelRestOver().catch(() => undefined);
  }, []);

  useEffect(() => {
    if (restStartedAt === null || !restOverEnabled) return;
    const endAt = restStartedAt + restFor * 1000;
    const id = setTimeout(() => {
      // A timer that fires late means the app was suspended in between, and
      // the system notification has already done its job.
      if (AppState.currentState !== 'active' || Date.now() - endAt > 2000) return;
      Vibration.vibrate();
      if (!focusedRef.current) {
        const { title, body, target } = planRestOverNotification(restStartedAt, restFor, session.id, exercise.exerciseName);
        showInAppBanner({ title, body, target });
      }
    }, Math.max(0, endAt - Date.now()));
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [restStartedAt, restFor, session.id, restOverEnabled]);

  return (
    <SafeAreaView edges={['bottom', 'left', 'right']} style={{ flex: 1, backgroundColor: colors.ground }}>
      <KeyboardAvoiding>
        {/* Progress strip */}
        <View style={{ paddingHorizontal: spacing.lg, paddingTop: spacing.md, gap: spacing.sm }}>
          <View style={{ flexDirection: 'row', gap: 4 }}>
            {session.exercises.map((ex, i) => {
              const done = ex.sets.length > 0 && ex.sets.every(s => s.completed);
              return <View key={ex.id} style={{ flex: 1, height: 4, borderRadius: 2, backgroundColor: done ? colors.success : i === index ? colors.accent : colors.surfaceRaised }} />;
            })}
          </View>
          <CustomText variant="caption" color={colors.inkMuted}>
            Exercise {index + 1} of {total} · {completedSets}/{totalSets} sets
          </CustomText>
        </View>

        <ScrollView contentContainerStyle={{ padding: spacing.lg }} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag">
          {/* Keyed by exercise so a change mounts fresh content that slides in from the side it came from. */}
          <Animated.View key={exercise.id} entering={(slideDir.current === 1 ? SlideInRight : SlideInLeft).duration(240)} style={{ gap: spacing.lg }}>
          {/* Only the How-to link opens the tutorial, so a stray tap on the header doesn't leave the workout. */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
            {catalog && <MuscleMap primary={catalog.primaryMuscles} secondary={catalog.secondaryMuscles} height={84} views="auto" />}
            <View style={{ flex: 1 }}>
              <CustomText variant="title">{exercise.exerciseName}</CustomText>
              <CustomText variant="caption" color={colors.inkMuted}>
                {catalog?.primaryMuscles.join(', ')}
                {workoutEntry?.repRangeMin ? ` · ${workoutEntry.repRangeMin}–${workoutEntry.repRangeMax} reps` : ''} · rest {restSec}s
              </CustomText>
              {catalog && (
                <TouchableOpacity
                  onPress={() => navigation.navigate('ExerciseDetailScreen', { exerciseId: catalog.id })}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 16 }}
                  accessibilityRole="link"
                  style={{ alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginTop: spacing.xs }}
                >
                  <Icon icon={generalIcons.info} color={colors.accent} size={14} />
                  <CustomText variant="caption" color={colors.accent}>How to</CustomText>
                </TouchableOpacity>
              )}
            </View>
          </View>

          <View style={{ backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.line, paddingVertical: spacing.md, overflow: 'hidden' }}>
            {exercise.sets.map(set => {
              const row = (
                <SetRow
                  set={set}
                  measurement={exercise.measurement}
                  draft={drafts[set.id] ?? { a: '', b: '' }}
                  unitLabels={unitLabels(exercise, units)}
                  onChange={d => setDrafts(prev => ({ ...prev, [set.id]: d }))}
                  onToggleDone={() => toggleDone(set)}
                  inset={spacing.md}
                />
              );
              return exercise.sets.length > 1 ? (
                <SwipeToDelete key={set.id} label="Remove set" onDelete={() => removeSet(set)}>
                  {row}
                </SwipeToDelete>
              ) : (
                <View key={set.id}>{row}</View>
              );
            })}
            <View style={{ flexDirection: 'row', justifyContent: 'center', gap: spacing.xl }}>
              {exercise.measurement === 'weight_reps' && (
                <TouchableOpacity onPress={addWarmupSet} style={{ paddingVertical: spacing.sm }}>
                  <CustomText variant="label" color={colors.accent}>
                    + Warm-up set
                  </CustomText>
                </TouchableOpacity>
              )}
              <TouchableOpacity onPress={addSet} style={{ paddingVertical: spacing.sm }}>
                <CustomText variant="label" color={colors.accent}>
                  + Add set
                </CustomText>
              </TouchableOpacity>
            </View>
          </View>
          </Animated.View>
        </ScrollView>

        <View style={{ padding: spacing.lg, paddingBottom: spacing.lg + tabBarInset, gap: spacing.sm, borderTopWidth: 1, borderTopColor: colors.line, backgroundColor: colors.ground }}>
          <View style={{ flexDirection: 'row', gap: spacing.sm }}>
            <TouchableOpacity
              disabled={index === 0}
              onPress={() => goTo(index - 1)}
              style={{ width: 52, alignItems: 'center', justifyContent: 'center', borderRadius: radius.md, backgroundColor: colors.surfaceRaised, opacity: index === 0 ? 0.4 : 1 }}
            >
              <Icon icon={directionIcons.angleLeft} color={colors.ink} size={24} />
            </TouchableOpacity>
            <View style={{ flex: 1 }}>
              {isLast ? (
                <PrimaryButton label="Finish workout" icon={generalIcons.check} busy={finishing} onPress={finish} />
              ) : (
                <PrimaryButton label="Next exercise" icon={directionIcons.angleRight} iconPosition="trailing" onPress={() => goTo(index + 1)} />
              )}
            </View>
          </View>
          {!isLast && (
            <TouchableOpacity onPress={finish} style={{ alignItems: 'center', paddingVertical: spacing.xs }}>
              <CustomText variant="caption" color={colors.inkMuted}>
                Finish early
              </CustomText>
            </TouchableOpacity>
          )}
        </View>
      </KeyboardAvoiding>
    </SafeAreaView>
  );
};
