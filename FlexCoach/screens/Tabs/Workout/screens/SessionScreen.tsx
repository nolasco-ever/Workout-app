import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, AppState, Platform, ScrollView, TouchableOpacity, Vibration, View } from 'react-native';
import { KeyboardAvoiding } from '../../../../components/layout/KeyboardAvoiding';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RouteProp, useIsFocused, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '../../../../data/auth/AuthProvider';
import { LoggedSet, Session, SessionExercise } from '../../../../data/models';
import { findWorkout } from '../../../../data/engine/schedule';
import { newId } from '../../../../data/engine/ids';
import { getCatalogExercise } from '../../../../data/catalog/exerciseCatalog';
import { abandonSession, addExerciseTo, addSetTo, addWarmupSetTo, finishSession, isQuickSession, logSet, removeExerciseFrom, removeSetFrom, saveExercises, saveSets, substituteExercise } from '../../../../data/services/workoutService';
import { sessionRepository } from '../../../../data/repositories/sessionRepository';
import { subscribeAdd, subscribeSwap } from '../components/swapChannel';
import { publishSession, subscribeSessionCommands } from '../components/sessionChannel';
import { warmupRestSec } from '../../../../data/engine/progression';
import { planRestOverNotification, planTimerDoneNotification, withPrefDefaults } from '../../../../data/engine/notifications';
import { cancelRestOver, cancelTimerDone, exactAlarmsAllowed, openExactAlarmSettings, scheduleRestOver, scheduleTimerDone } from '../../../../data/notifications/notificationService';
import { userRepository } from '../../../../data/repositories/userRepository';
import { showInAppBanner } from '../../../../data/notifications/inAppBanner';
import { CustomText } from '../../../../components/text/customText';
import { Icon } from '../../../../components/icons/Icon';
import { directionIcons, generalIcons } from '../../../../components/icons/icon-library';
import { useTheme } from '../../../../theme';
import { WorkoutStackParams } from '../WorkoutStack';
import { useTabBarInset } from '../../../../navigation/useTabBarInset';
import { PrimaryButton } from '../../../../components/buttons/PrimaryButton';
import { GLASS_BUTTON_SIZE, GlassIconButton } from '../../../../components/buttons/GlassIconButton';
import { MuscleMap } from '../../../../components/anatomy/MuscleMap';
import { RestPill, SessionTitle } from '../components/SessionHeader';
import { SetDraft, SetRow } from '../components/SetRow';
import { CardioSetCard, CardioTimer, timerElapsed } from '../components/CardioSetCard';
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
  // The rest timer belongs to the set just finished, not to the exercise on
  // screen, so moving between exercises leaves it running.
  const goTo = (next: number) => {
    slideDir.current = next > index ? 1 : -1;
    setIndex(next);
  };
  const [restStartedAt, setRestStartedAt] = useState<number | null>(null);
  /** Length of the rest that is running: shorter after a warm-up set. */
  const [restFor, setRestFor] = useState(90);
  const [finishing, setFinishing] = useState(false);
  /** The one stopwatch a timed or cardio set can run: which set, since when, and the target it counts down to, if any. */
  const [cardioTimer, setCardioTimer] = useState<(CardioTimer & { setId: string; targetSec: number | null; exerciseName: string }) | null>(null);

  // Undefined only while a quick workout has nothing in it yet.
  const exercise: SessionExercise | undefined = session.exercises[index];
  const workoutEntry = plan && exercise ? findWorkout(plan, session.workoutId)?.exercises.find(e => e.id === exercise.workoutExerciseId) : undefined;
  const restSec = workoutEntry?.restSec ?? 90;
  const timedExercise = exercise?.measurement === 'time' || exercise?.measurement === 'distance_time';
  const catalog = exercise ? getCatalogExercise(exercise.exerciseId) : null;
  const quick = isQuickSession(session);
  const total = session.exercises.length;
  const completedSets = useMemo(() => session.exercises.reduce((n, ex) => n + ex.sets.filter(s => s.completed).length, 0), [session]);
  const totalSets = useMemo(() => session.exercises.reduce((n, ex) => n + ex.sets.length, 0), [session]);

  // Leaving the screen keeps the session in progress; Home offers Resume.
  // The header's back button is our own rather than the native one, so the
  // question is asked before anything pops: with the native button, a pop
  // the dialog then cancelled could leave the stack and the screen
  // disagreeing, and Resume on the Workout tab did nothing afterwards.
  const leavingRef = useRef(false);
  const confirmLeave = (leave: () => void) => {
    // A quick workout with nothing logged has nothing to keep: just drop it.
    const current = sessionRef.current;
    if (isQuickSession(current) && !current.exercises.some(ex => ex.sets.some(st => st.completed))) {
      leavingRef.current = true;
      if (uid) abandonSession(uid, current, cycle).catch(err => console.warn('abandon failed', err));
      leave();
      return;
    }
    Alert.alert('Leave workout?', 'Your sets are saved. You can resume from the Workout tab.', [
      { text: 'Stay', style: 'cancel' },
      {
        text: 'Leave',
        onPress: () => {
          leavingRef.current = true;
          leave();
        },
      },
      {
        text: 'Discard workout',
        style: 'destructive',
        onPress: async () => {
          if (uid) await abandonSession(uid, sessionRef.current, cycle);
          leavingRef.current = true;
          leave();
        },
      },
    ]);
  };
  const confirmLeaveRef = useRef(confirmLeave);
  confirmLeaveRef.current = confirmLeave;
  useEffect(() => {
    // Android's hardware back and anything else that removes the screen.
    return navigation.addListener('beforeRemove', e => {
      if (finishing || leavingRef.current) return;
      e.preventDefault();
      confirmLeaveRef.current(() => navigation.dispatch(e.data.action));
    });
  }, [navigation, finishing]);

  const persist = async (ex: SessionExercise, set: LoggedSet) => {
    const next: Session = {
      ...session,
      exercises: session.exercises.map(e => (e.id === ex.id ? { ...e, sets: e.sets.map(s => (s.id === set.id ? set : s)) } : e)),
    };
    setSession(next);
    if (uid) logSet(uid, next, ex.id, set).catch(err => console.warn('logSet failed', err));
  };

  const toggleDone = (set: LoggedSet, draft: SetDraft = drafts[set.id]) => {
    if (!exercise) return;
    const merged = fromDraft(exercise, set, draft, units);
    const done = !set.completed;
    persist(exercise, { ...merged, completed: done, completedAt: done ? Date.now() : null });
    // No rest after the workout's final set: there is nothing left to rest for.
    const workoutDone = done && index === session.exercises.length - 1 && exercise.sets.every(s => s.id === set.id || s.completed);
    setRestFor(set.warmup ? warmupRestSec(restSec) : restSec);
    setRestStartedAt(done && !workoutDone ? Date.now() : null);
  };

  // The stopwatch for timed and cardio sets. Time comes only from it: the
  // clock is not typed. Stopping writes the seconds into the set's draft and
  // saves the set, so a stopped time survives leaving the screen. Starting
  // another set's timer stops the running one first.
  const stopCardioTimer = (): { setId: string; draft: SetDraft } | null => {
    if (!cardioTimer) return null;
    const seconds = timerElapsed(cardioTimer);
    const draft: SetDraft = { ...(drafts[cardioTimer.setId] ?? { a: '', b: '' }), b: String(seconds) };
    setDrafts(d => ({ ...d, [cardioTimer.setId]: draft }));
    setCardioTimer(null);
    const owner = session.exercises.find(ex => ex.sets.some(st => st.id === cardioTimer.setId));
    const set = owner?.sets.find(st => st.id === cardioTimer.setId);
    if (owner && set) persist(owner, fromDraft(owner, set, draft, units)).catch(err => console.warn('timer save failed', err));
    return { setId: cardioTimer.setId, draft };
  };
  const startCardioTimer = (set: LoggedSet) => {
    if (!exercise) return;
    stopCardioTimer();
    const baseSec = Math.max(0, Math.round(Number(drafts[set.id]?.b) || 0));
    setCardioTimer({ setId: set.id, startedAt: Date.now(), baseSec, targetSec: exercise.target.durationSec, exerciseName: exercise.exerciseName });
  };
  const toggleCardioDone = (set: LoggedSet) => {
    const stopped = cardioTimer?.setId === set.id ? stopCardioTimer() : null;
    toggleDone(set, stopped?.draft ?? drafts[set.id]);
  };
  // A swap or a removed set can take the timed set away mid-run.
  useEffect(() => {
    if (cardioTimer && !session.exercises.some(ex => ex.sets.some(st => st.id === cardioTimer.setId))) setCardioTimer(null);
  }, [session, cardioTimer]);
  // A timed exercise is one effort, not sets. Older data (and plans that
  // still say 3 × 30s) can carry extras: keep the logged one, or the first.
  useEffect(() => {
    if (!exercise || !timedExercise || exercise.sets.length <= 1) return;
    const keep = exercise.sets.find(s => s.completed) ?? exercise.sets[0];
    let next = session;
    for (const s of exercise.sets) if (s.id !== keep.id) next = removeSetFrom(next, exercise.id, s.id);
    setSession(next);
    if (uid) saveSets(uid, next, exercise.id).catch(err => console.warn('trim timed sets failed', err));
    // Runs when the exercise on screen changes; `session` is read, not depended on, to avoid a loop.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exercise?.id, exercise?.sets.length, timedExercise]);

  // A pick on the swap screen replaces this exercise for the rest of the
  // session. Sets already logged for it are dropped, so ask first.
  useEffect(
    () =>
      subscribeSwap(async (sessionExerciseId, replacement) => {
        const current = sessionRef.current;
        const ex = current.exercises.find(e => e.id === sessionExerciseId);
        if (!ex || !uid) return;
        const apply = async () => {
          const history = await sessionRepository.listCompleted(uid).catch(() => [] as Session[]);
          const next = substituteExercise(sessionRef.current, sessionExerciseId, replacement, plan, history, units.weight, newId);
          const swapped = next.exercises.find(e => e.id === sessionExerciseId)!;
          setSession(next);
          setDrafts(d => {
            const out = { ...d };
            for (const set of swapped.sets) out[set.id] = toDraft(swapped, set, units);
            return out;
          });
          saveExercises(uid, next).catch(err => console.warn('swap failed', err));
        };
        const logged = ex.sets.filter(s => s.completed).length;
        if (logged > 0) {
          Alert.alert(`Swap to ${replacement.name}?`, `The ${logged} set${logged === 1 ? '' : 's'} you logged for ${ex.exerciseName} will be dropped.`, [
            { text: 'Keep', style: 'cancel' },
            { text: 'Swap', style: 'destructive', onPress: () => { apply().catch(err => console.warn(err)); } },
          ]);
        } else {
          await apply();
        }
      }),
    // units and plan don't change during a session.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [uid],
  );

  // A pick on the add screen joins the session on the end and comes into view.
  useEffect(
    () =>
      subscribeAdd(async picked => {
        if (!uid) return;
        const history = await sessionRepository.listCompleted(uid).catch(() => [] as Session[]);
        const { session: next, exercise: added } = addExerciseTo(sessionRef.current, picked, plan, history, units.weight, newId);
        setSession(next);
        setDrafts(d => {
          const out = { ...d };
          for (const set of added.sets) out[set.id] = toDraft(added, set, units);
          return out;
        });
        saveExercises(uid, next).catch(err => console.warn('add exercise failed', err));
      }),
    // units and plan don't change during a session.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [uid],
  );

  // The exercise list is a modal screen over this one; it reads the live
  // session from the channel and sends back jumps and removals.
  useEffect(() => publishSession(session), [session]);
  const openList = () => navigation.navigate('SessionExercisesScreen', { workoutName: session.workoutName, currentIndex: index });
  const addExercise = () => navigation.navigate('ExercisePickerScreen', { mode: 'session', excludeIds: sessionRef.current.exercises.map(e => e.exerciseId) });
  // A quick workout starts empty: the first thing to do is pick something, so the picker opens itself once.
  const pickerOpened = useRef(false);
  useEffect(() => {
    if (pickerOpened.current || session.exercises.length > 0) return;
    pickerOpened.current = true;
    const id = setTimeout(addExercise, 350);
    return () => clearTimeout(id);
    // Only on mount with an empty session.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const goToRef = useRef(goTo);
  goToRef.current = goTo;
  const askRemoveRef = useRef<(ex: SessionExercise) => void>(() => undefined);
  useEffect(
    () =>
      subscribeSessionCommands(command => {
        if (command.kind === 'jump') goToRef.current(command.index);
        else {
          const ex = sessionRef.current.exercises.find(e => e.id === command.sessionExerciseId);
          if (ex) askRemoveRef.current(ex);
        }
      }),
    [],
  );

  // An added exercise can be swiped out of the list again. Logged sets go with it, so ask first.
  const removeExercise = (ex: SessionExercise) => {
    const current = sessionRef.current;
    const at = current.exercises.findIndex(e => e.id === ex.id);
    if (at === -1 || current.exercises.length <= 1) return;
    const next = removeExerciseFrom(current, ex.id);
    setSession(next);
    if (uid) saveExercises(uid, next).catch(err => console.warn('remove exercise failed', err));
    // Keep the same exercise on screen: it may have moved up a slot.
    if (at < index) setIndex(index - 1);
    else if (at === index) goTo(Math.min(index, next.exercises.length - 1));
  };
  const askRemoveExercise = (ex: SessionExercise) => {
    // Called from the list screen's command; see askRemoveRef.
    const logged = ex.sets.filter(s => s.completed).length;
    if (logged === 0) {
      removeExercise(ex);
      return;
    }
    Alert.alert(`Remove ${ex.exerciseName}?`, `The ${logged} set${logged === 1 ? '' : 's'} you logged for it will be dropped.`, [
      { text: 'Keep', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => removeExercise(ex) },
    ]);
  };
  askRemoveRef.current = askRemoveExercise;

  const addWarmupSet = () => {
    if (!exercise) return;
    const { session: next, set } = addWarmupSetTo(session, exercise.id, units.weight, newId);
    setSession(next);
    setDrafts(d => ({ ...d, [set.id]: toDraft(exercise, set, units) }));
    if (uid) saveSets(uid, next, exercise.id).catch(err => console.warn('addWarmupSet failed', err));
  };

  const addSet = () => {
    if (!exercise) return;
    const { session: next, set } = addSetTo(session, exercise.id, newId);
    setSession(next);
    setDrafts(d => ({ ...d, [set.id]: toDraft(exercise, set, units) }));
    if (uid) saveSets(uid, next, exercise.id).catch(err => console.warn('addSet failed', err));
  };

  // Any set can be swiped away, down to the last one. Removing a completed
  // set also takes it out of the count and the volume.
  const removeSet = (set: LoggedSet) => {
    if (!exercise || exercise.sets.length <= 1) return;
    const next = removeSetFrom(session, exercise.id, set.id);
    setSession(next);
    if (uid) saveSets(uid, next, exercise.id).catch(err => console.warn('removeSet failed', err));
  };

  // A ref as well as state: two taps in the same frame would both see
  // `finishing` false and finish the session twice.
  const finishingRef = useRef(false);
  const finish = () => {
    if (!uid || finishingRef.current) return;
    if (completedSets === 0) {
      Alert.alert('Nothing logged yet', 'Mark at least one set done before finishing.');
      return;
    }
    // A stray tap on Finish would end the workout for good, so ask first.
    const open = totalSets - completedSets;
    Alert.alert(
      open > 0 ? 'Finish early?' : 'Finish workout?',
      open > 0 ? `${completedSets} of ${totalSets} sets logged. The other ${open === 1 ? 'one stays' : `${open} stay`} unlogged.` : `All ${totalSets} sets logged. Nice work.`,
      [
        { text: 'Keep going', style: 'cancel' },
        { text: 'Finish', onPress: () => { doFinish().catch(err => console.warn(err)); } },
      ],
    );
  };
  const doFinish = async () => {
    if (!uid || finishingRef.current) return;
    finishingRef.current = true;
    setFinishing(true);
    try {
      const result = await finishSession(uid, profile, session, cycle);
      navigation.replace('SessionCompleteScreen', { result });
    } catch (err) {
      console.warn(err);
      finishingRef.current = false;
      setFinishing(false);
    }
  };

  const isLast = index === total - 1;

  const dismissRest = () => setRestStartedAt(null);
  // Android 14+ holds timers back unless the app may set exact alarms, and
  // nobody finds the switch for it in Settings. Ask once, the first time a
  // workout runs on a phone where it is off.
  const exactPrompted = !!profile?.exactAlarmPromptedAt;
  useEffect(() => {
    if (Platform.OS !== 'android' || !uid || !profile || exactPrompted) return;
    exactAlarmsAllowed()
      .then(allowed => {
        if (allowed) return;
        userRepository.update(uid, { exactAlarmPromptedAt: Date.now() }).catch(() => undefined);
        Alert.alert('Rest timer needs exact timing', 'Android delays alarms unless FlexCoach is allowed to set exact ones. Allow it and the rest-over alert lands on the second.', [
          { text: 'Not now', style: 'cancel' },
          { text: 'Allow', onPress: () => openExactAlarmSettings() },
        ]);
      })
      .catch(() => undefined);
    // profile identity changes often; the prompt only depends on whether it was shown.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uid, exactPrompted]);

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
    scheduleRestOver(planRestOverNotification(restStartedAt, restFor, session.id, exercise?.exerciseName ?? '')).catch(err => console.warn('rest timer notification failed', err));
    // exercise.exerciseName only changes with `index`, which also resets the timer.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [restStartedAt, restFor, session.id, restOverEnabled, inBackground]);
  useEffect(() => () => {
    cancelRestOver().catch(() => undefined);
  }, []);

  // The cardio countdown's "time's up", handled the same way as the rest timer:
  // a system notification only for time spent in the background, a buzz and
  // a banner when the app is in front. Nothing fires for a count-up.
  const countdownEndAt = cardioTimer && cardioTimer.targetSec !== null && cardioTimer.baseSec < cardioTimer.targetSec ? cardioTimer.startedAt + (cardioTimer.targetSec - cardioTimer.baseSec) * 1000 : null;
  const countdownPlan = () => (cardioTimer && countdownEndAt !== null ? planTimerDoneNotification(countdownEndAt, cardioTimer.targetSec ?? 0, session.id, cardioTimer.exerciseName) : null);
  useEffect(() => {
    const planned = countdownPlan();
    if (!planned || !restOverEnabled || !inBackground) {
      cancelTimerDone().catch(() => undefined);
      return;
    }
    scheduleTimerDone(planned).catch(err => console.warn('timer notification failed', err));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [countdownEndAt, session.id, restOverEnabled, inBackground]);
  useEffect(() => () => {
    cancelTimerDone().catch(() => undefined);
  }, []);
  useEffect(() => {
    if (countdownEndAt === null || !restOverEnabled) return;
    const id = setTimeout(() => {
      if (AppState.currentState !== 'active' || Date.now() - countdownEndAt > 2000) return;
      Vibration.vibrate();
      const planned = countdownPlan();
      if (!focusedRef.current && planned) showInAppBanner({ title: planned.title, body: planned.body, target: planned.target });
    }, Math.max(0, countdownEndAt - Date.now()));
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [countdownEndAt, session.id, restOverEnabled]);

  useEffect(() => {
    if (restStartedAt === null || !restOverEnabled) return;
    const endAt = restStartedAt + restFor * 1000;
    const id = setTimeout(() => {
      // A timer that fires late means the app was suspended in between, and
      // the system notification has already done its job.
      if (AppState.currentState !== 'active' || Date.now() - endAt > 2000) return;
      Vibration.vibrate();
      if (!focusedRef.current) {
        const { title, body, target } = planRestOverNotification(restStartedAt, restFor, session.id, exercise?.exerciseName ?? '');
        showInAppBanner({ title, body, target });
      }
    }, Math.max(0, endAt - Date.now()));
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [restStartedAt, restFor, session.id, restOverEnabled]);

  return (
    <SafeAreaView edges={['top', 'bottom', 'left', 'right']} style={{ flex: 1, backgroundColor: colors.ground }}>
      <KeyboardAvoiding>
        {/*
          Our own header row instead of the native one: the title with the
          running clock sits dead centre of the screen whatever is beside it.
          The native bar centred it between the back button and the rest
          pill, so the pill shoved it left.
        */}
        <View style={{ height: 56, justifyContent: 'center', paddingHorizontal: spacing.md }}>
          {/* The row only passes touches to its buttons, so the title beneath it stays tappable. */}
          <View pointerEvents="box-none" style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <GlassIconButton icon={directionIcons.angleLeft} nudgeX={-1} accessibilityLabel="Back" onPress={() => confirmLeaveRef.current(() => navigation.goBack())} />
            {restStartedAt === null ? <View style={{ width: GLASS_BUTTON_SIZE }} /> : <RestPill startedAt={restStartedAt} durationSec={restFor} onDismiss={dismissRest} />}
          </View>
          <View pointerEvents="box-none" style={{ position: 'absolute', left: 0, right: 0, alignItems: 'center' }}>
            <SessionTitle name={session.workoutName} startedAt={session.startedAt} onPress={openList} />
          </View>
        </View>

        <ScrollView contentContainerStyle={{ padding: spacing.lg }} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag">
          {/* Keyed by exercise so a change mounts fresh content that slides in from the side it came from. */}
          {!exercise && (
            <View style={{ alignItems: 'center', gap: spacing.md, paddingTop: spacing.xxl }}>
              <Icon icon={generalIcons.dumbbell} size={36} color={colors.inactive} />
              <CustomText variant="heading" centered>What are you doing today?</CustomText>
              <CustomText variant="body" color={colors.inkMuted} centered>Add an exercise, a run, a stretch, whatever it is. It all counts.</CustomText>
            </View>
          )}
          {exercise && (
          <Animated.View key={exercise.id} entering={(slideDir.current === 1 ? SlideInRight : SlideInLeft).duration(240)} style={{ gap: spacing.lg }}>
          {/* Only the How-to link opens the tutorial, so a stray tap on the header doesn't leave the workout. */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
            {catalog && <MuscleMap primary={catalog.primaryMuscles} secondary={catalog.secondaryMuscles} height={84} views="auto" />}
            <View style={{ flex: 1 }}>
              <CustomText variant="title">{exercise.exerciseName}</CustomText>
              <CustomText variant="caption" color={colors.inkMuted}>
                {catalog?.primaryMuscles.join(', ')}
                {workoutEntry?.repRangeMin ? ` · ${workoutEntry.repRangeMin}–${workoutEntry.repRangeMax} reps` : ''}{timedExercise ? '' : ` · rest ${restSec}s`}
              </CustomText>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.lg, marginTop: spacing.xs }}>
                {catalog && (
                  <TouchableOpacity
                    onPress={() => navigation.navigate('ExerciseDetailScreen', { exerciseId: catalog.id })}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    accessibilityRole="link"
                    style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}
                  >
                    <Icon icon={generalIcons.info} color={colors.accent} size={14} />
                    <CustomText variant="caption" color={colors.accent}>How to</CustomText>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  onPress={() => navigation.navigate('ExercisePickerScreen', { mode: 'swap', sessionExerciseId: exercise.id, exerciseId: exercise.exerciseId, excludeIds: session.exercises.map(e => e.exerciseId) })}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  accessibilityRole="link"
                  style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}
                >
                  <Icon icon={generalIcons.swap} color={colors.accent} size={14} />
                  <CustomText variant="caption" color={colors.accent}>Swap</CustomText>
                </TouchableOpacity>
              </View>
              {exercise.substitutedFor && (
                <CustomText variant="caption" color={colors.inkMuted} style={{ marginTop: spacing.xs }}>
                  In place of {exercise.substitutedFor.exerciseName} for this workout
                </CustomText>
              )}
              {!quick && exercise.workoutExerciseId === null && !exercise.substitutedFor && (
                <CustomText variant="caption" color={colors.inkMuted} style={{ marginTop: spacing.xs }}>Added for this workout</CustomText>
              )}
            </View>
          </View>

          {timedExercise ? (
          <CardioSetCard
            set={exercise.sets[0]}
            draft={drafts[exercise.sets[0].id] ?? { a: '', b: '' }}
            unitLabel={unitLabels(exercise, units).a}
            timer={cardioTimer?.setId === exercise.sets[0].id ? cardioTimer : null}
            targetSec={exercise.target.durationSec}
            onChange={d => setDrafts(prev => ({ ...prev, [exercise.sets[0].id]: d }))}
            onStart={() => startCardioTimer(exercise.sets[0])}
            onStop={stopCardioTimer}
            onToggleDone={() => toggleCardioDone(exercise.sets[0])}
          />
          ) : (
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
          )}
          </Animated.View>
          )}
        </ScrollView>

        <View style={{ padding: spacing.lg, paddingBottom: spacing.lg + tabBarInset, gap: spacing.sm, borderTopWidth: 1, borderTopColor: colors.line, backgroundColor: colors.ground }}>
          {!exercise && <PrimaryButton label="Add exercise" icon={generalIcons.plus} onPress={addExercise} />}
          {exercise && (
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
          )}
        </View>

      </KeyboardAvoiding>
    </SafeAreaView>
  );
};
