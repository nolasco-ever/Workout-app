import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '../../../../data/auth/AuthProvider';
import { LoggedSet, Session, SessionExercise } from '../../../../data/models';
import { findWorkout } from '../../../../data/engine/schedule';
import { newId } from '../../../../data/engine/ids';
import { getCatalogExercise } from '../../../../data/catalog/exerciseCatalog';
import { abandonSession, finishSession, logSet } from '../../../../data/services/workoutService';
import { planRestOverNotification, withPrefDefaults } from '../../../../data/engine/notifications';
import { cancelRestOver, scheduleRestOver } from '../../../../data/notifications/notificationService';
import { CustomText } from '../../../../components/text/customText';
import { Icon } from '../../../../components/icons/Icon';
import { directionIcons, generalIcons } from '../../../../components/icons/icon-library';
import { useTheme } from '../../../../theme';
import { WorkoutStackParams } from '../WorkoutStack';
import { useTabBarInset } from '../../../../navigation/useTabBarInset';
import { PrimaryButton } from '../../../../components/buttons/PrimaryButton';
import { MuscleMap } from '../../../../components/anatomy/MuscleMap';
import { RestTimer } from '../components/RestTimer';
import { SetDraft, SetRow } from '../components/SetRow';
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
  const [restStartedAt, setRestStartedAt] = useState<number | null>(null);
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
    setRestStartedAt(done ? Date.now() : null);
  };

  const addSet = () => {
    const last = exercise.sets[exercise.sets.length - 1];
    const set: LoggedSet = { ...last, id: newId(), setNumber: exercise.sets.length + 1, completed: false, completedAt: null };
    const next: Session = { ...session, exercises: session.exercises.map(e => (e.id === exercise.id ? { ...e, sets: [...e.sets, set] } : e)) };
    setSession(next);
    setDrafts(d => ({ ...d, [set.id]: toDraft(exercise, set, units) }));
    if (uid) logSet(uid, next, exercise.id, set).catch(err => console.warn('addSet failed', err));
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

  // The OS fires "Rest over" at the exact second, with sound and vibration,
  // whether the app is in the background or open on another screen. Any
  // change to the timer replaces the pending one; leaving the screen clears it.
  const restOverWanted = withPrefDefaults(profile?.notifications);
  useEffect(() => {
    if (restStartedAt === null || !restOverWanted.enabled || !restOverWanted.restOver) {
      cancelRestOver().catch(() => undefined);
      return;
    }
    scheduleRestOver(planRestOverNotification(restStartedAt, restSec, session.id, exercise.exerciseName)).catch(err => console.warn('rest timer notification failed', err));
    // exercise.exerciseName only changes with `index`, which also resets the timer.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [restStartedAt, restSec, session.id, restOverWanted.enabled, restOverWanted.restOver]);
  useEffect(() => () => {
    cancelRestOver().catch(() => undefined);
  }, []);

  return (
    <SafeAreaView edges={['bottom', 'left', 'right']} style={{ flex: 1, backgroundColor: colors.ground }}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }} keyboardVerticalOffset={100}>
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

        <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.lg }} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag">
          <TouchableOpacity
            disabled={!catalog}
            activeOpacity={0.7}
            onPress={() => catalog && navigation.navigate('ExerciseDetailScreen', { exerciseId: catalog.id })}
            style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}
          >
            {catalog && <MuscleMap primary={catalog.primaryMuscles} secondary={catalog.secondaryMuscles} height={84} views="auto" />}
            <View style={{ flex: 1 }}>
              <CustomText variant="title">{exercise.exerciseName}</CustomText>
              <CustomText variant="caption" color={colors.inkMuted}>
                {catalog?.primaryMuscles.join(', ')}
                {workoutEntry?.repRangeMin ? ` · ${workoutEntry.repRangeMin}–${workoutEntry.repRangeMax} reps` : ''} · rest {restSec}s
              </CustomText>
              {catalog && (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginTop: spacing.xs }}>
                  <Icon icon={generalIcons.info} color={colors.accent} size={14} />
                  <CustomText variant="caption" color={colors.accent}>How to</CustomText>
                </View>
              )}
            </View>
          </TouchableOpacity>

          <View style={{ backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.line, padding: spacing.md }}>
            {exercise.sets.map(set => (
              <SetRow
                key={set.id}
                set={set}
                measurement={exercise.measurement}
                draft={drafts[set.id] ?? { a: '', b: '' }}
                unitLabels={unitLabels(exercise, units)}
                onChange={d => setDrafts(prev => ({ ...prev, [set.id]: d }))}
                onToggleDone={() => toggleDone(set)}
              />
            ))}
            <TouchableOpacity onPress={addSet} style={{ paddingVertical: spacing.sm, alignItems: 'center' }}>
              <CustomText variant="label" color={colors.accent}>
                + Add set
              </CustomText>
            </TouchableOpacity>
          </View>
        </ScrollView>

        <View style={{ padding: spacing.lg, paddingBottom: spacing.lg + tabBarInset, gap: spacing.sm, borderTopWidth: 1, borderTopColor: colors.line, backgroundColor: colors.ground }}>
          <RestTimer startedAt={restStartedAt} durationSec={restSec} onDismiss={() => setRestStartedAt(null)} />
          <View style={{ flexDirection: 'row', gap: spacing.sm }}>
            <TouchableOpacity
              disabled={index === 0}
              onPress={() => setIndex(i => i - 1)}
              style={{ width: 52, alignItems: 'center', justifyContent: 'center', borderRadius: radius.md, backgroundColor: colors.surfaceRaised, opacity: index === 0 ? 0.4 : 1 }}
            >
              <Icon icon={directionIcons.angleLeft} color={colors.ink} size={24} />
            </TouchableOpacity>
            <View style={{ flex: 1 }}>
              {isLast ? (
                <PrimaryButton label="Finish workout" icon={generalIcons.check} busy={finishing} onPress={finish} />
              ) : (
                <PrimaryButton label="Next exercise" icon={directionIcons.angleRight} onPress={() => { setRestStartedAt(null); setIndex(i => i + 1); }} />
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
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};
