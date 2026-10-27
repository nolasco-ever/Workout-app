import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Alert, AppState, Keyboard, KeyboardEvent, Platform, ScrollView, TextInput, TouchableOpacity, useWindowDimensions, Vibration, View } from 'react-native';
import { KeyboardAvoiding } from '../../../../components/layout/KeyboardAvoiding';
import { SafeAreaView } from '../../../../components/layout/SafeAreaView';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSideRail } from '../../../../navigation/useSideRail';
import { useLayoutFamily, WIDE_MIN } from '../../../../components/layout/useLayoutFamily';
import { useBookGutter } from '../../../../components/layout/useBookGutter';
import { useFold } from '../../../../data/fold/useFold';
import { useSessionOrientation } from '../../../../navigation/useSessionOrientation';
import { SessionExerciseList, SessionProgressStrip } from '../components/SessionExerciseList';
import { RouteProp, useIsFocused, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '../../../../data/auth/AuthProvider';
import { LoggedSet, Session, SessionExercise } from '../../../../data/models';
import { findWorkout } from '../../../../data/engine/schedule';
import { newId } from '../../../../data/engine/ids';
import { getCatalogExercise } from '../../../../data/catalog/exerciseCatalog';
import { abandonSession, addExerciseTo, addSetTo, addWarmupSetTo, copyWorkoutIntoQuickSession, finishSession, isQuickSession, logSet, removeExerciseFrom, removeSetFrom, saveExercises, saveSets, substituteExercise } from '../../../../data/services/workoutService';
import { sessionRepository } from '../../../../data/repositories/sessionRepository';
import { subscribeAdd, subscribeCopyWorkout, subscribeSwap } from '../components/swapChannel';
import { publishSession, subscribeSessionCommands } from '../components/sessionChannel';
import { warmupRestSec } from '../../../../data/engine/progression';
import { DONE_LINGER_SECONDS, liveActivity } from '../../../../data/liveActivity/liveActivity';
import { liveActivityRepository } from '../../../../data/repositories/liveActivityRepository';
import { currentDeviceToken } from '../../../../data/notifications/pushService';
import { buildLiveActivityState, describeDone, describeFinish } from '../components/liveActivityState';
import { droppedLine, finishPrompt } from '../components/finishPrompt';
import { onWatchDistance, takeWatchDistance } from '../../../../data/liveActivity/watchDistance';
import { cardioDone, cardioStats } from '../../../../data/engine/stats';
import { planRestOverNotification, planTimerDoneNotification, withPrefDefaults } from '../../../../data/engine/notifications';
import { cancelRestOver, cancelTimerDone, exactAlarmsAllowed, openExactAlarmSettings, scheduleRestOver, scheduleTimerDone } from '../../../../data/notifications/notificationService';
import { userRepository } from '../../../../data/repositories/userRepository';
import { showInAppBanner } from '../../../../data/notifications/inAppBanner';
import { CustomText } from '../../../../components/text/customText';
import { Icon } from '../../../../components/icons/Icon';
import { directionIcons, generalIcons } from '../../../../components/icons/icon-library';
import { useTheme } from '../../../../theme';
import { AppStackParams } from '../../../../appNavigators/AppStack';
import { useTabBarInset } from '../../../../navigation/useTabBarInset';
import { PrimaryButton } from '../../../../components/buttons/PrimaryButton';
import { GLASS_BUTTON_SIZE, GlassIconButton } from '../../../../components/buttons/GlassIconButton';
import { MuscleMap } from '../../../../components/anatomy/MuscleMap';
import { RestPill, SessionTitle } from '../components/SessionHeader';
import { SetDraft, SetRow } from '../components/SetRow';
import { CardioSetCard, CardioTimer, timerElapsed } from '../components/CardioSetCard';
import { SwipeToDelete } from '../../../../components/list-items/SwipeToDelete';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { fromDraft, toDraft, Units, unitLabels } from '../components/setDrafts';
import { parseNumber, toDisplayDistance } from '../../../../data/engine/units';

/** The exercise list's pane beside the current exercise on a wide window. */
const LIST_PANE_WIDTH = 320;

export const SessionScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParams>>();
  const { params } = useRoute<RouteProp<AppStackParams, 'SessionScreen'>>();
  const { plan, cycle, activePlan } = params;
  const { colors, spacing, radius } = useTheme();
  const insets = useSafeAreaInsets();
  const { top: headerTop } = useSideRail();
  // On a wide window the exercise list stands beside the current exercise; the sheet and the footer are for phones.
  const wide = useLayoutFamily() === 'wide';
  // Held like a book, the panes split on the crease.
  const book = useBookGutter();
  // Placed on a surface like a laptop (half open, hinge flat): the standing half is looked at, the flat half is tapped.
  const fold = useFold();
  const laptop = fold.posture === 'tabletop' && fold.fold?.axis === 'horizontal' && fold.halves !== null;
  const topHalf = laptop && fold.halves ? fold.halves[0].height : 0;
  // Standing on its edges (tent mode): the closed phone's outer display on its side, the only landscape in the app.
  useSessionOrientation();
  const { width: winWidth, height: winHeight } = useWindowDimensions();
  const tent = fold.foldable && !laptop && winWidth > winHeight && winWidth < WIDE_MIN;
  // The tent's root pads every inset itself (the rail runs along the top or the bottom edge, whichever way it was turned), so the header row adds none.
  const sideInset = tent ? 0 : insets.right;
  const creaseHeight = laptop && fold.fold ? fold.fold.rect.height : 0;
  // While the keyboard is up (it takes the flat half) the flat pane slides up over the standing half by exactly what
  // the keyboard covers of it, a transform only: nothing re-lays out, so the field being typed in keeps its focus. A
  // thin accessory bar (a hardware keyboard) lifts it a little, a full keyboard most of the way; the pane never goes
  // above the top inset.
  const [keyboardUp, setKeyboardUp] = useState(false);
  const lift = useSharedValue(0);
  const liftStyle = useAnimatedStyle(() => ({ transform: [{ translateY: -lift.value }] }));
  const windowHeight = fold.window.height;
  const liftFor = useCallback((keyboardTop: number) => Math.min(Math.max(0, topHalf + creaseHeight - insets.top), Math.max(0, windowHeight - keyboardTop)), [topHalf, creaseHeight, insets.top, windowHeight]);
  useEffect(() => {
    if (!laptop) {
      setKeyboardUp(false);
      lift.value = 0;
      return;
    }
    // A keyboard worth lifting for: a real one on screen, not the thin bar a hardware keyboard leaves.
    const realKeyboard = (frame: { height: number; screenY: number } | undefined) => !!frame && frame.height >= 100 && frame.screenY < windowHeight;
    const show = (frame: { height: number; screenY: number } | undefined, duration?: number) => {
      const up = realKeyboard(frame);
      setKeyboardUp(up);
      const to = up && frame ? liftFor(frame.screenY) : 0;
      lift.value = duration === undefined ? to : withTiming(to, { duration: Math.max(10, duration), easing: Easing.out(Easing.cubic) });
    };
    // Entering the pose with the keyboard already up (a field kept its focus through the fold): start lifted. Pose
    // changes can leave Keyboard.isVisible() stale, so here a focused field is required too. (Not on the show notice
    // itself: that can arrive before the field's own focus event.)
    const focused = TextInput.State.currentlyFocusedInput() !== null;
    show(focused && Keyboard.isVisible() ? Keyboard.metrics() ?? undefined : undefined);
    const onShow = (e: KeyboardEvent) => show(e.endCoordinates, e?.duration ?? 250);
    const onHide = (e: KeyboardEvent) => show(undefined, e?.duration ?? 250);
    const subs =
      Platform.OS === 'ios'
        ? [Keyboard.addListener('keyboardWillShow', onShow), Keyboard.addListener('keyboardWillHide', onHide), Keyboard.addListener('keyboardDidHide', onHide)]
        : [Keyboard.addListener('keyboardDidShow', onShow), Keyboard.addListener('keyboardDidHide', onHide)];
    return () => subs.forEach(sub => sub.remove());
  }, [laptop, lift, liftFor, windowHeight]);
  // Done puts the keyboard away; it also drops the pane itself, in case no hide notice follows.
  const dismissKeyboard = () => {
    Keyboard.dismiss();
    TextInput.State.blurTextInput(TextInput.State.currentlyFocusedInput());
    setKeyboardUp(false);
    lift.value = withTiming(0, { duration: 220, easing: Easing.out(Easing.cubic) });
  };
  // The standing half's muscle map fills the height left under the header and the progress strip (arithmetic, not a measurement: a measured height fed back into the map could chase itself).
  const mapHeight = Math.max(96, topHalf - insets.top - 56 - 44 - spacing.lg * 2);
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
  // A change of exercise slides the new content in from the side it came from. A transform driven by hand rather than
  // Reanimated's entering animation: that one keeps its own index of the view tree, and a fold or a rotation that
  // re-parents the whole screen put it out of step (an assertion in LayoutAnimationsProxy froze the app).
  const slideIn = useSharedValue(0);
  const slideStyle = useAnimatedStyle(() => ({ transform: [{ translateX: slideIn.value }], opacity: 1 - Math.abs(slideIn.value) / 96 }));
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
  const allComplete = total > 0 && session.exercises.every(ex => ex.sets.length > 0 && ex.sets.every(st => st.completed));

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
    // Stay leads; it is not the cancel button because iOS would then sink it to the bottom of a three-button alert.
    Alert.alert('Leave workout?', 'You can resume from the Workout tab.', [
      { text: 'Stay' },
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
    // The set's own exercise, not the one on screen: a set logged on the Watch can belong to the next exercise while
    // the phone still shows the last one, and was saved against the wrong one (so it never showed as done).
    const owner = session.exercises.find(ex => ex.sets.some(st => st.id === set.id)) ?? exercise;
    if (!owner) return;
    const merged = fromDraft(owner, set, draft, units);
    const done = !set.completed;
    persist(owner, { ...merged, completed: done, completedAt: done ? Date.now() : null });
    // The rest runs after the workout's final set too: lifters asked for it (build 18), and the finish is their call.
    setRestFor(set.warmup ? warmupRestSec(restSec) : restSec);
    setRestStartedAt(done ? Date.now() : null);
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
  // `owner`: the set's exercise, when it is not the one on screen (Play on the Watch).
  const startCardioTimer = (set: LoggedSet, owner: SessionExercise | undefined = exercise) => {
    if (!owner) return;
    stopCardioTimer();
    const baseSec = Math.max(0, Math.round(Number(drafts[set.id]?.b) || 0));
    setCardioTimer({ setId: set.id, startedAt: Date.now(), baseSec, targetSec: owner.target.durationSec, exerciseName: owner.exerciseName });
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
          Alert.alert(`Swap to ${replacement.name}?`, droppedLine(ex, true), [
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
  // An empty quick workout can also start as a copy of one of the plan's
  // workouts, from a link at the top of the picker: same exercises and
  // targets, but outside the plan. The link only shows while it is empty.
  const planWorkouts = activePlan ? [...activePlan.plan.workouts].sort((a, b) => a.order - b.order).filter(w => w.exercises.length > 0) : [];
  // The header row's measurements, for keeping the centred title clear of the rest pill.
  const [rowWidth, setRowWidth] = useState(0);
  const [pillWidth, setPillWidth] = useState(0);
  const [titleWidth, setTitleWidth] = useState(0);
  // How far left the title must slide so its right edge clears the pill, capped so its left edge clears the back button.
  const overlap = Math.max(0, titleWidth / 2 + pillWidth + spacing.sm - rowWidth / 2);
  const titleShift = Math.min(overlap, Math.max(0, rowWidth / 2 - titleWidth / 2 - GLASS_BUTTON_SIZE - spacing.sm));
  const addExercise = () =>
    navigation.navigate('ExercisePickerScreen', {
      mode: 'session',
      excludeIds: sessionRef.current.exercises.map(e => e.exerciseId),
      planWorkouts: sessionRef.current.exercises.length === 0 && planWorkouts.length > 0 ? planWorkouts : undefined,
    });
  const copyingRef = useRef(false);
  const copyWorkout = async (workoutId: string) => {
    if (!uid || !activePlan || copyingRef.current) return;
    copyingRef.current = true;
    try {
      const next = await copyWorkoutIntoQuickSession(uid, sessionRef.current, activePlan.plan, activePlan.cycle, workoutId, units.weight);
      setSession(next);
      setDrafts(() => {
        const out: Record<string, SetDraft> = {};
        for (const ex of next.exercises) for (const s of ex.sets) out[s.id] = toDraft(ex, s, units);
        return out;
      });
      setIndex(0);
    } catch (err) {
      console.warn('copy workout failed', err);
      Alert.alert('Could not copy that workout', 'Give it another try.');
    } finally {
      copyingRef.current = false;
    }
  };
  const copyWorkoutRef = useRef(copyWorkout);
  copyWorkoutRef.current = copyWorkout;
  useEffect(() => subscribeCopyWorkout(id => { copyWorkoutRef.current(id).catch(() => undefined); }), []);
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
        else if (command.kind === 'activity') applyCommandRef.current({ kind: command.command, id: command.id });
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
    Alert.alert(`Remove ${ex.exerciseName}?`, droppedLine(ex, false), [
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
    const prompt = finishPrompt(session);
    if ('nothing' in prompt) {
      Alert.alert('Nothing logged yet', prompt.nothing);
      return;
    }
    // A stray tap on Finish would end the workout for good, so ask first.
    Alert.alert(
      prompt.title,
      prompt.message,
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
      // The activity's last word: the summary lingers on the lock screen while the screen goes.
      activityEndedRef.current = true;
      liveActivity.end(
        {
          ...activityStateRef.current,
          phase: 'done',
          summary: describeFinish(result.setsCompleted, result.volumeKg, result.personalRecords.length, units, cardioDone([result.session]).map(c => c.name)),
          done: describeDone(result.durationSec, result.setsCompleted, result.volumeKg, result.personalRecords.length, units, cardioStats(result.session, units.distance)),
        },
        DONE_LINGER_SECONDS,
      );
      navigation.replace('SessionCompleteScreen', { result });
    } catch (err) {
      console.warn(err);
      finishingRef.current = false;
      setFinishing(false);
    }
  };

  const isLast = index === total - 1;
  const exerciseId = exercise?.id ?? null;
  useLayoutEffect(() => {
    if (!exerciseId) return;
    slideIn.value = slideDir.current * 48;
    slideIn.value = withTiming(0, { duration: 240, easing: Easing.out(Easing.cubic) });
  }, [exerciseId, slideIn]);

  // A rest put away after it ran out (the pill folding, or a tap then) is announced as over; a skip mid-rest is not.
  const dismissRest = () => {
    const over = restStartedAt !== null && Date.now() >= restStartedAt + restFor * 1000;
    setRestStartedAt(null);
    if (over) setRestJustEnded(true);
  };
  // The rest ends by the clock, not only by the pill's fold-away animation (which does not run while the app is behind
  // another screen): a moment after it runs out the state moves on, so the Live Activity gets its next set. The system
  // does the same on its own from the activity's stale date when the app is asleep; this covers the app being awake.
  // A rest that ran out is announced for a few seconds ("Rest over", the Island opening on it) before the plain next set.
  const [restJustEnded, setRestJustEnded] = useState(false);
  useEffect(() => {
    if (restStartedAt === null) return;
    const endAt = restStartedAt + restFor * 1000;
    const id = setTimeout(() => {
      setRestStartedAt(current => (current === restStartedAt ? null : current));
      setRestJustEnded(true);
    }, Math.max(0, endAt + 1500 - Date.now()));
    return () => clearTimeout(id);
  }, [restStartedAt, restFor]);
  useEffect(() => {
    if (!restJustEnded) return;
    const id = setTimeout(() => setRestJustEnded(false), 6000);
    return () => clearTimeout(id);
  }, [restJustEnded]);
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

  // The workout's Live Activity (iOS): started with the screen, updated on every change of what it shows, ended on
  // leave; finishing ends it with the summary instead. Its buttons come back as commands, live while the app runs and
  // from the App Group queue after it was in the background or killed.
  const activityState = buildLiveActivityState({ session, index, drafts, units, restStartedAt, restFor, restSec, clock: cardioTimer, restJustEnded });
  const activityStateRef = useRef(activityState);
  activityStateRef.current = activityState;
  const activityEndedRef = useRef(false);
  const activityStartedRef = useRef(false);
  useEffect(() => {
    activityStartedRef.current = liveActivity.start(sessionRef.current.workoutName, sessionRef.current.id, activityStateRef.current);
    return () => {
      if (!activityEndedRef.current) liveActivity.end();
    };
    // Once per screen: the session it shows does not change identity.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const activityJson = JSON.stringify(activityState);
  useEffect(() => {
    // No alert from here: the native side announces the rest's end itself (its own timer, or the server's push), so the app's update is quiet.
    if (activityStartedRef.current && !activityEndedRef.current) liveActivity.update(activityStateRef.current);
  }, [activityJson]);
  // A phone with a Dynamic Island (the top inset of an Island phone, or a folding phone's rail) gets the rest's end
  // on the Island from a server push, timed to the second while the app sleeps, instead of the local notification.
  const islandPush = Platform.OS === 'ios' && (fold.foldable || insets.top >= 54);
  const [activityPushToken, setActivityPushToken] = useState<string | null>(() => liveActivity.pushToken());
  useEffect(() => liveActivity.onPushToken(setActivityPushToken), []);
  useEffect(() => {
    if (!uid || !islandPush || !activityPushToken) return;
    const resting = restStartedAt !== null;
    liveActivityRepository
      .save(uid, {
        sessionId: sessionRef.current.id,
        token: activityPushToken,
        deviceToken: currentDeviceToken(),
        restId: resting ? String(restStartedAt) : null,
        restEndsAt: resting ? restStartedAt + restFor * 1000 : null,
        // What the push shows: the next set, announced as rest over.
        state: resting ? { ...activityStateRef.current, phase: 'restOver', restEndsAt: undefined, exercises: undefined, exerciseIndex: undefined } : null,
        updatedAt: Date.now(),
      })
      .catch(err => console.warn('live activity schedule failed', err));
  }, [uid, islandPush, activityPushToken, restStartedAt, restFor]);
  useEffect(() => {
    if (!uid || !islandPush) return;
    const sessionId = sessionRef.current.id;
    return () => {
      liveActivityRepository.remove(uid, sessionId).catch(() => undefined);
    };
  }, [uid, islandPush]);
  // A cardio entry's distance from the Watch (v1 #6, step 3): it fills the entry, over anything typed (the Watch is
  // trusted, owner 2026-10-25), and is saved at once, logged or not: End on the Watch logs the entry before it comes.
  useEffect(
    () =>
      onWatchDistance((setId, meters) => {
        const current = sessionRef.current;
        const owner = current.exercises.find(ex => ex.measurement === 'distance_time' && ex.sets.some(st => st.id === setId));
        const set = owner?.sets.find(st => st.id === setId);
        if (!owner || !set) return;
        takeWatchDistance(setId);
        const measured: LoggedSet = { ...set, distanceM: meters, distanceSource: 'watch' };
        setDrafts(d => ({ ...d, [setId]: { ...(d[setId] ?? toDraft(owner, set, units)), a: String(toDisplayDistance(meters, units.distance) ?? '') } }));
        const next: Session = { ...current, exercises: current.exercises.map(e => (e.id === owner.id ? { ...e, sets: e.sets.map(st => (st.id === setId ? measured : st)) } : e)) };
        sessionRef.current = next;
        setSession(next);
        if (uid) logSet(uid, next, owner.id, measured).catch(err => console.warn('watch distance save failed', err));
      }),
    // units don't change during a session.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [uid],
  );

  const applyCommandRef = useRef((command: { kind: string; id: string }) => {});
  applyCommandRef.current = command => {
    switch (command.kind) {
      case 'completeSet': {
        for (const ex of sessionRef.current.exercises) {
          const set = ex.sets.find(st => st.id === command.id);
          if (!set) continue;
          if (set.completed) return;
          // The Watch moves on to the next exercise once this one's last set is in; the phone goes with it, so both
          // show the same exercise.
          const exercises = sessionRef.current.exercises;
          const at = exercises.indexOf(ex);
          const lastOfExercise = ex.sets.every(st => st.completed || st.id === set.id);
          const order = [...exercises.slice(at + 1), ...exercises.slice(0, at)];
          const following = lastOfExercise ? order.find(e => e.sets.some(st => !st.completed)) : undefined;
          const shown = following ? exercises.indexOf(following) : at;
          if (shown !== index) goTo(shown);
          // A timed set still running (End on the Watch) logs the time on its clock.
          if (cardioTimer?.setId === set.id) toggleCardioDone(set);
          else toggleDone(set);
          return;
        }
        return;
      }
      case 'resumeCardio': {
        // Play on the Watch: the paused timed set's clock carries on from its time so far.
        for (const ex of sessionRef.current.exercises) {
          const set = ex.sets.find(st => st.id === command.id);
          if (!set || set.completed) continue;
          const at = sessionRef.current.exercises.indexOf(ex);
          if (at !== index) goTo(at);
          startCardioTimer(set, ex);
          return;
        }
        return;
      }
      case 'showExercise': {
        // A swipe on the Watch: the phone moves to that exercise, and its next set is what the Watch logs.
        const at = sessionRef.current.exercises.findIndex(ex => ex.id === command.id);
        if (at !== -1 && at !== index) goTo(at);
        return;
      }
      case 'finishWorkout':
        // Finish on the Watch, confirmed there: the same finish as the phone's button.
        if (completedSets > 0) doFinish().catch(err => console.warn(err));
        return;
      case 'skipRest':
        dismissRest();
        return;
      case 'stopCardio':
        stopCardioTimer();
        return;
    }
  };
  useEffect(() => liveActivity.onCommand(command => applyCommandRef.current(command)), []);
  useEffect(() => {
    if (inBackground) return;
    // Back in front: whatever was tapped on the activity meanwhile, in order, for this workout only.
    for (const command of liveActivity.drainCommands()) {
      if (command.at >= sessionRef.current.startedAt) applyCommandRef.current(command);
    }
  }, [inBackground]);

  useEffect(() => {
    // An Island phone hears the rest's end on the Island instead (the server's push), unless no token came.
    if (restStartedAt === null || !restOverEnabled || !inBackground || (islandPush && activityPushToken !== null)) {
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

  const headerRow = (
    <>
        {/* The top inset by hand: beside a folding phone's status column the inset is 0, so the row drops to the Dynamic Island's level, clear of the round corners. */}
        <View style={{ height: 56, justifyContent: 'center', paddingHorizontal: spacing.md, paddingRight: spacing.md + sideInset, marginTop: laptop ? insets.top : tent ? spacing.sm : headerTop }} onLayout={e => setRowWidth(e.nativeEvent.layout.width - spacing.md * 2 - sideInset)}>
          {/* The row only passes touches to its buttons, so the title beneath it stays tappable. */}
          <View pointerEvents="box-none" style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <GlassIconButton icon={directionIcons.angleLeft} nudgeX={-1} accessibilityLabel="Back" onPress={() => confirmLeaveRef.current(() => navigation.goBack())} />
            <View onLayout={e => setPillWidth(e.nativeEvent.layout.width)}>
              {restStartedAt === null ? <View style={{ width: GLASS_BUTTON_SIZE }} /> : <RestPill startedAt={restStartedAt} durationSec={restFor} onDismiss={dismissRest} />}
            </View>
          </View>
          {/* Dead centre when there is room; on a narrow row (a folding phone's outer display) it slides left just enough to clear the rest pill, and never over the back button. */}
          <View pointerEvents="box-none" style={{ position: 'absolute', left: 0, right: 0, alignItems: 'center', transform: [{ translateX: -titleShift }] }}>
            <View onLayout={e => setTitleWidth(e.nativeEvent.layout.width)} style={{ maxWidth: Math.max(0, rowWidth - GLASS_BUTTON_SIZE - pillWidth - spacing.md * 2) }}>
              <SessionTitle name={session.workoutName} startedAt={session.startedAt} onPress={wide ? undefined : openList} />
            </View>
          </View>
        </View>
    </>
  );
  // The exercise's name, muscles, targets and links: beside the small map on a phone, beside the tall one in the laptop pose.
  const details = exercise ? (
            <View style={{ flex: 1 }}>
              <CustomText variant="title">{exercise.exerciseName}</CustomText>
              <CustomText variant="caption" color={colors.inkMuted}>
                {catalog?.primaryMuscles.join(', ')}
                {workoutEntry?.repRangeMin ? ` · ${workoutEntry.repRangeMin}–${workoutEntry.repRangeMax} reps` : ''}{timedExercise ? '' : ` · rest ${restSec}s`}
              </CustomText>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.lg, marginTop: spacing.xs }}>
                {catalog && (
                  <TouchableOpacity
                    onPress={() => navigation.navigate('ExerciseDetailScreen', { exerciseId: catalog.id, knownAs: exercise.exerciseName })}
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
  ) : null;
  const setsCard = exercise ? (timedExercise ? (
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
            fill={tent}
            fromWatch={exercise.sets[0].distanceSource === 'watch' && parseNumber(drafts[exercise.sets[0].id]?.a ?? '') === toDisplayDistance(exercise.sets[0].distanceM, units.distance)}
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
          )) : null;
  // The way between exercises (or, with nothing in the workout yet, the way to add one); the footer wraps it on a phone.
  const navRow = (
    <>
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
    </>
  );
  const footer = (
        <View style={{ padding: spacing.lg, paddingBottom: spacing.lg + tabBarInset, gap: spacing.sm, borderTopWidth: 1, borderTopColor: colors.line, backgroundColor: colors.ground }}>
          {navRow}
        </View>
  );

  // Tent mode: one row of header, the progress strip, then the muscle map, the exercise's details and the way between
  // exercises down the left, and the sets filling the right. No tab bar, so the content runs to the edges; only the
  // status rail is kept clear, along whichever long edge it landed on (a small bottom inset is the home indicator, run under).
  if (tent) {
    const railBottom = insets.bottom >= 60 ? insets.bottom : 0;
    // The map takes what the header (56), the strip (30), two lines of details (44), previous / next (52) and the gaps leave.
    const mapHeight = Math.min(220, Math.max(72, winHeight - insets.top - railBottom - 210));
    return (
      <View style={{ flex: 1, backgroundColor: colors.ground, paddingTop: insets.top, paddingBottom: railBottom }}>
        <KeyboardAvoiding>
          {headerRow}
          <View style={{ paddingHorizontal: spacing.lg }}>
            <SessionProgressStrip session={session} currentIndex={index} />
          </View>
          <View style={{ flex: 1, flexDirection: 'row', gap: spacing.lg, paddingHorizontal: spacing.lg, paddingTop: spacing.sm }}>
            <View style={{ width: '38%', gap: spacing.sm }}>
              <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                {exercise && catalog && <MuscleMap primary={catalog.primaryMuscles} secondary={catalog.secondaryMuscles} height={mapHeight} views="auto" />}
              </View>
              {/* The details without How to and Swap: on the floor, neither is wanted. */}
              {exercise && (
                <View style={{ flexShrink: 0, alignItems: 'center' }}>
                  <CustomText variant="title" numberOfLines={2} centered>{exercise.exerciseName}</CustomText>
                  <CustomText variant="caption" color={colors.inkMuted} centered>
                    {catalog?.primaryMuscles.join(', ')}
                    {workoutEntry?.repRangeMin ? ` · ${workoutEntry.repRangeMin}–${workoutEntry.repRangeMax} reps` : ''}{timedExercise ? '' : ` · rest ${restSec}s`}
                  </CustomText>
                </View>
              )}
              {/* The display's corners are rounded: the buttons and the card stop short of them. */}
              <View style={{ flexShrink: 0, paddingTop: spacing.xs, paddingBottom: spacing.lg }}>{navRow}</View>
            </View>
            {/* A timed exercise's card fills the pane; sets scroll to the screen's edge. */}
            {timedExercise ? (
              <View style={{ flex: 1, paddingBottom: spacing.lg }}>{setsCard}</View>
            ) : (
            <View style={{ flex: 1 }}>
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: spacing.lg }} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag">
                {setsCard ?? (
                  <View style={{ alignItems: 'center', gap: spacing.md, paddingTop: spacing.xl }}>
                    <Icon icon={generalIcons.dumbbell} size={36} color={colors.inactive} />
                    <CustomText variant="heading" centered>What are you doing today?</CustomText>
                    <CustomText variant="body" color={colors.inkMuted} centered>Add an exercise, a run, a stretch, whatever it is. It all counts.</CustomText>
                  </View>
                )}
              </ScrollView>
            </View>
            )}
          </View>
        </KeyboardAvoiding>
      </View>
    );
  }

  // Placed on a surface: the standing half holds the header, the progress strip, the exercise's details and the muscle
  // map at full height, none of it tapped; the flat half holds the sets and the way between exercises. With the keyboard
  // up, the flat half's pane lifts over the standing half, down to the keyboard's edge, so the set being typed stays in view.
  if (laptop) {
    return (
      <SafeAreaView edges={['left', 'right']} style={{ flex: 1, backgroundColor: colors.ground }}>
        <View style={{ height: topHalf }}>
          {headerRow}
          <View style={{ paddingHorizontal: spacing.lg, paddingTop: spacing.sm }}>
            <SessionProgressStrip session={session} currentIndex={index} />
          </View>
          {exercise ? (
            <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacing.xl, padding: spacing.lg }}>
              {/* The map at the left, the side the primary muscle is on; the details at the right, large enough to read from the bar. */}
              <View style={{ width: '40%', alignItems: 'center', justifyContent: 'center' }}>
                {catalog && <MuscleMap primary={catalog.primaryMuscles} secondary={catalog.secondaryMuscles} height={mapHeight} views="auto" />}
              </View>
              <View style={{ flex: 1, gap: spacing.sm }}>
                <CustomText variant="title">{exercise.exerciseName}</CustomText>
                <CustomText variant="body" color={colors.inkMuted}>
                  {catalog?.primaryMuscles.join(', ')}
                  {workoutEntry?.repRangeMin ? ` · ${workoutEntry.repRangeMin}–${workoutEntry.repRangeMax} reps` : ''}{timedExercise ? '' : ` · rest ${restSec}s`}
                </CustomText>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xl, marginTop: spacing.xs }}>
                  {catalog && (
                    <TouchableOpacity onPress={() => navigation.navigate('ExerciseDetailScreen', { exerciseId: catalog.id, knownAs: exercise.exerciseName })} hitSlop={8} accessibilityRole="link" style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
                      <Icon icon={generalIcons.info} color={colors.accent} size={18} />
                      <CustomText variant="bodyStrong" color={colors.accent}>How to</CustomText>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity
                    onPress={() => navigation.navigate('ExercisePickerScreen', { mode: 'swap', sessionExerciseId: exercise.id, exerciseId: exercise.exerciseId, excludeIds: session.exercises.map(e => e.exerciseId) })}
                    hitSlop={8}
                    accessibilityRole="link"
                    style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}
                  >
                    <Icon icon={generalIcons.swap} color={colors.accent} size={18} />
                    <CustomText variant="bodyStrong" color={colors.accent}>Swap</CustomText>
                  </TouchableOpacity>
                </View>
                {exercise.substitutedFor && <CustomText variant="body" color={colors.inkMuted}>In place of {exercise.substitutedFor.exerciseName} for this workout</CustomText>}
                {!quick && exercise.workoutExerciseId === null && !exercise.substitutedFor && <CustomText variant="body" color={colors.inkMuted}>Added for this workout</CustomText>}
              </View>
            </View>
          ) : (
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md, padding: spacing.lg }}>
              <Icon icon={generalIcons.dumbbell} size={36} color={colors.inactive} />
              <CustomText variant="heading" centered>What are you doing today?</CustomText>
              <CustomText variant="body" color={colors.inkMuted} centered>Add an exercise, a run, a stretch, whatever it is. It all counts.</CustomText>
            </View>
          )}
        </View>
        {/* The crease: the system's reserved band, left empty. */}
        <View style={{ height: creaseHeight }} />
        <Animated.View style={[{ flex: 1, backgroundColor: colors.ground }, liftStyle]}>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: spacing.lg }} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag">
            {setsCard}
          </ScrollView>
          {/* With the keyboard up there is no empty ground to tap: a Done pill at the right, where previous / next were, puts it away. A pill, not a button, so it does not read as "done with the workout". */}
          {keyboardUp ? (
            <View style={{ padding: spacing.lg, paddingBottom: spacing.lg + tabBarInset, borderTopWidth: 1, borderTopColor: colors.line, backgroundColor: colors.ground, flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', minHeight: 52 + spacing.lg * 2 + tabBarInset }}>
              <TouchableOpacity onPress={dismissKeyboard} accessibilityRole="button" accessibilityLabel="Hide keyboard" hitSlop={8} style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs, height: 40, paddingHorizontal: spacing.lg, borderRadius: radius.pill, backgroundColor: colors.accentTint }}>
                <Icon icon={directionIcons.angleDown} size={16} color={colors.accent} strokeWidth={2.5} />
                <CustomText variant="label" color={colors.accent}>Done</CustomText>
              </TouchableOpacity>
            </View>
          ) : (
            footer
          )}
        </Animated.View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={wide ? ['left', 'right'] : ['bottom', 'left', 'right']} style={{ flex: 1, backgroundColor: colors.ground }}>
      <KeyboardAvoiding>
        {/*
          Our own header row instead of the native one: the title with the
          running clock sits dead centre of the screen whatever is beside it.
          The native bar centred it between the back button and the rest
          pill, so the pill shoved it left.
        */}
        {headerRow}

        <View style={{ flex: 1, flexDirection: wide ? 'row' : 'column', gap: wide ? book?.gap ?? spacing.lg : 0, paddingLeft: wide ? spacing.lg : 0 }}>
        {wide && (
          <View style={{ width: book ? Math.max(0, book.left - spacing.lg) : LIST_PANE_WIDTH }}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: spacing.lg, paddingBottom: spacing.lg + insets.bottom }}>
              <SessionExerciseList session={session} currentIndex={index} onJump={goTo} onRemove={ex => askRemoveRef.current(ex)} />
              <PrimaryButton label="Add exercise" variant="outline" icon={generalIcons.plus} onPress={addExercise} />
            </ScrollView>
          </View>
        )}
        <View style={{ flex: 1 }}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: spacing.lg, paddingBottom: wide ? spacing.lg + insets.bottom : spacing.lg }} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag">
          {/* Keyed by exercise so a change mounts fresh content that slides in from the side it came from. */}
          {!exercise && (
            <View style={{ alignItems: 'center', gap: spacing.md, paddingTop: spacing.xxl }}>
              <Icon icon={generalIcons.dumbbell} size={36} color={colors.inactive} />
              <CustomText variant="heading" centered>What are you doing today?</CustomText>
              <CustomText variant="body" color={colors.inkMuted} centered>Add an exercise, a run, a stretch, whatever it is. It all counts.</CustomText>
            </View>
          )}
          {exercise && (
          <Animated.View key={exercise.id} style={[{ gap: spacing.lg }, slideStyle]}>
          {/* Only the How-to link opens the tutorial, so a stray tap on the header doesn't leave the workout. */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
            {catalog && <MuscleMap primary={catalog.primaryMuscles} secondary={catalog.secondaryMuscles} height={84} views="auto" />}
            {details}
          </View>

          {setsCard}

          </Animated.View>
          )}
        </ScrollView>

        {!wide && footer}
        {/* No footer beside the list: a tap on the list moves between exercises. Finish shows once every set is in. */}
        {wide && allComplete && (
          <View style={{ padding: spacing.lg, paddingBottom: spacing.lg + insets.bottom, borderTopWidth: 1, borderTopColor: colors.line, backgroundColor: colors.ground }}>
            <PrimaryButton label="Finish workout" icon={generalIcons.check} busy={finishing} onPress={finish} />
          </View>
        )}
        </View>
        </View>
      </KeyboardAvoiding>
    </SafeAreaView>
  );
};
