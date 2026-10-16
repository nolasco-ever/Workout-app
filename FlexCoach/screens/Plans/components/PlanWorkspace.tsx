import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Alert, ScrollView, TouchableOpacity, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { ColumnHeader } from './ColumnHeader';
import { useAuth } from '../../../data/auth/AuthProvider';
import { useWorkoutHome } from '../../../data/hooks/useWorkoutHome';
import { saveActivePlan, savePlan } from '../../../data/services/planService';
import { planRepository } from '../../../data/repositories/planRepository';
import { useIsFocused, useNavigation, usePreventRemove } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { validatePlan } from '../../../data/services/planService';
import { PlanProblem } from '../../../data/services/planService';
import { SafeAreaView } from '../../../components/layout/SafeAreaView';
import { CustomText } from '../../../components/text/customText';
import { SurfaceCard } from '../../../components/cards/SurfaceCard';
import { Icon } from '../../../components/icons/Icon';
import { directionIcons, generalIcons } from '../../../components/icons/icon-library';
import { useTheme } from '../../../theme';
import { useBookGutter } from '../../../components/layout/useBookGutter';
import { PlansStackParams, leaveEditor } from '../routes';
import { usePlanEditor } from '../PlanEditorContext';
import { describeSchedule, GOAL_LABEL } from './planSummary';
import { PlanSaveFooter } from './PlanSaveFooter';
import { PlanSummaryCard } from './PlanSummaryCard';
import { PlanBasicsStep } from './steps/PlanBasicsStep';
import { PlanWorkoutsStep } from './steps/PlanWorkoutsStep';
import { PlanScheduleStep } from './steps/PlanScheduleStep';
import { WorkoutEditor } from './steps/WorkoutEditor';
import { ExerciseEntry } from './steps/ExerciseEntry';

export type PlanSection = 'basics' | 'workouts' | 'schedule' | 'review';

/** Which part a validation problem belongs to. */
const sectionOf = (p: PlanProblem): PlanSection => (p.field === 'name' ? 'basics' : p.field === 'workouts' ? 'workouts' : 'schedule');

/**
 * Creating and editing a plan on a wide window, in one place. Three
 * columns, each half the width, two in view at a time: the plan's parts
 * with their state and the only way out (the save footer, disabled until
 * nothing is missing); the chosen part, the same screens as on a phone
 * without their Next and Done footers; and, when a workout is opened, its
 * exercises, which slide in from the right and push the parts off to the
 * left. Review shows the summary and a banner per problem that opens the
 * part to fix.
 */
export const PlanWorkspace = ({ mode, initial = 'basics', initialWorkoutId = null, initialEntryId = null, onDone }: { mode: 'create' | 'edit'; initial?: PlanSection; /** A workout (and one of its exercises) to open at once: a phone's pushed screens, re-arranged on a rotation. */ initialWorkoutId?: string | null; initialEntryId?: string | null; onDone: () => void }) => {
  const navigation = useNavigation<NativeStackNavigationProp<PlansStackParams>>();
  const { colors, spacing } = useTheme();
  const { uid } = useAuth();
  const home = useWorkoutHome();
  const { draft, original, clear, stopAutosave } = usePlanEditor();
  const [section, setSection] = useState<PlanSection>(initial);
  // The workout whose exercises fill the third column, if one is open; it closes with its workout, or when another part is chosen.
  const [workoutId, setWorkoutId] = useState<string | null>(initialWorkoutId);
  const openWorkout = draft?.workouts.find(w => w.id === workoutId) ? workoutId : null;
  // The exercise whose prescription fills the fourth column, if one is open.
  const [entryId, setEntryId] = useState<string | null>(initialEntryId);
  const openEntry = openWorkout && draft?.workouts.find(w => w.id === openWorkout)?.exercises.some(e => e.id === entryId) ? entryId : null;
  // A rotation can hand the workspace a workout or exercise after it is up (a phone's sheet closing onto it).
  useEffect(() => {
    if (initialWorkoutId) setWorkoutId(initialWorkoutId);
  }, [initialWorkoutId]);
  useEffect(() => {
    if (initialEntryId) setEntryId(initialEntryId);
  }, [initialEntryId]);
  const choose = (next: PlanSection) => {
    setSection(next);
    setWorkoutId(null);
    setEntryId(null);
  };
  // How many columns deep: the parts, a workout, an exercise. Two columns are in view.
  const level = openEntry ? 2 : openWorkout ? 1 : 0;
  const levelRef = useRef(level);
  levelRef.current = level;
  // The columns slide as a strip: one column's width to the left per level. The line between the two in view runs
  // down the window's middle, which is the crease's centre when the phone is held like a book; each column then keeps
  // half the crease clear on the side that meets it, so nothing sits on the fold.
  const [width, setWidth] = useState(0);
  const book = useBookGutter();
  const half = width / 2;
  const crease = book ? book.gap / 2 : 0;
  const shift = useSharedValue(0);
  useEffect(() => {
    shift.value = withTiming(level * half, { duration: 280, easing: Easing.out(Easing.cubic) });
  }, [level, half, shift]);
  const slotStyle = (slot: number) => ({ width: half, paddingLeft: slot === 0 ? 0 : crease, paddingRight: slot === 3 ? 0 : crease });
  const strip = useAnimatedStyle(() => ({ transform: [{ translateX: -shift.value }] }));

  // The native back button is the one way back: a column at a time while a workout or an exercise is open, then out,
  // after the question. usePreventRemove holds the screen in place meanwhile: the native stack cancels its own pop and
  // re-attaches the screen, and the answer dispatches the pop again. (A hand-written beforeRemove listener cannot do
  // that: the pop would already have happened.) The footer's own way out skips the question. Leaving pops the whole
  // run of editor screens a phone may have stacked (each would draw this workspace again); only the screen in front
  // holds, so the ones underneath let that pop through.
  const draftRef = useRef(draft);
  draftRef.current = draft;
  const originalRef = useRef(original);
  originalRef.current = original;
  const cycleRef = useRef(home.cycle);
  cycleRef.current = home.cycle;
  const leavingRef = useRef(false);
  const askLeave = useCallback((leaveScreen: () => void) => {
    const current = draftRef.current;
    if (!current) {
      leaveScreen();
      return;
    }
    const discard = () => {
      stopAutosave();
      if (mode === 'create' && uid) planRepository.remove(uid, current.id).catch(() => undefined);
      clear();
      leaveScreen();
    };
    if (mode === 'create') {
      Alert.alert('Leave the new plan?', 'Leave keeps it as an unfinished draft to pick up later. Discard deletes it.', [
        { text: 'Stay', style: 'cancel' },
        { text: 'Leave', onPress: leaveScreen },
        { text: 'Discard', style: 'destructive', onPress: discard },
      ]);
      return;
    }
    // Editing: the changes are saved or dropped, nothing in between.
    const missing = validatePlan(current);
    const save = async () => {
      if (!uid) return;
      try {
        const orig = originalRef.current;
        if (orig?.status === 'active') await saveActivePlan(uid, orig, current, cycleRef.current);
        else await savePlan(uid, current);
        clear();
        leaveScreen();
      } catch (err) {
        console.warn(err);
        Alert.alert('Something went wrong', 'The plan was not saved. Try again.');
      }
    };
    Alert.alert(
      'Save your changes?',
      missing.length ? `They can't be saved yet: ${missing[0].message.replace(/\.$/, '').toLowerCase()}. Discard drops them.` : 'Discard drops them.',
      missing.length
        ? [
            { text: 'Stay', style: 'cancel' },
            { text: 'Discard', style: 'destructive', onPress: discard },
          ]
        : [
            { text: 'Stay', style: 'cancel' },
            { text: 'Discard', style: 'destructive', onPress: discard },
            { text: 'Save', onPress: () => { save().catch(() => undefined); } },
          ],
    );
  }, [mode, uid, clear, stopAutosave]);
  const focused = useIsFocused();
  usePreventRemove(focused && (!!draft || level > 0), ({ data }) => {
    const leaveScreen = () => {
      leavingRef.current = true;
      leaveEditor(navigation);
    };
    if (leavingRef.current) navigation.dispatch(data.action);
    else if (levelRef.current === 2) setEntryId(null);
    else if (levelRef.current === 1) setWorkoutId(null);
    else askLeave(leaveScreen);
  });
  useLayoutEffect(() => {
    navigation.setOptions({
      title: mode === 'create' ? 'New plan' : 'Edit plan',
      headerBackVisible: true,
    });
  }, [navigation, mode]);
  const done = () => {
    leavingRef.current = true;
    clear();
    onDone();
  };

  if (!draft) return null;
  const problems = validatePlan(draft);
  const exercises = draft.workouts.reduce((n, w) => n + w.exercises.length, 0);
  const empty = draft.workouts.filter(w => w.exercises.length === 0);
  const rows: { key: PlanSection; title: string; detail: string; ok: boolean }[] = [
    { key: 'basics', title: 'Basics', detail: `${draft.name.trim() || 'No name yet'} · ${GOAL_LABEL[draft.goal ?? 'hypertrophy']}`, ok: !!draft.name.trim() },
    {
      key: 'workouts',
      title: 'Workouts',
      detail: draft.workouts.length === 0 ? 'No workouts yet' : `${draft.workouts.map(w => w.name).join(', ')} · ${exercises} exercise${exercises === 1 ? '' : 's'}${empty.length ? ` · ${empty.map(w => w.name).join(', ')} empty` : ''}`,
      ok: draft.workouts.length > 0 && empty.length === 0,
    },
    { key: 'schedule', title: 'Schedule', detail: describeSchedule(draft), ok: !problems.some(p => p.field === 'schedule') },
    { key: 'review', title: 'Review', detail: 'The whole plan at a glance', ok: problems.length === 0 },
  ];

  const titleOf = rows.find(r => r.key === section)?.title ?? '';
  return (
    <SafeAreaView edges={['bottom', 'left', 'right']} style={{ flex: 1, backgroundColor: colors.ground }}>
      <View style={{ flex: 1, overflow: 'hidden' }} onLayout={e => setWidth(e.nativeEvent.layout.width)}>
        {width > 0 && (
          <Animated.View style={[{ flex: 1, flexDirection: 'row', width: half * 4 }, strip]}>
            {/* 1. The parts */}
            <View style={{ ...slotStyle(0), borderRightWidth: 1, borderRightColor: colors.line }}>
              <ColumnHeader title="Plan" />
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: spacing.lg, gap: spacing.md }}>
                <CustomText variant="body" color={colors.inkMuted}>{mode === 'create' ? 'Fill in each part. Activate or save once everything is in.' : 'Tap a part of the plan to change it.'}</CustomText>
                <SurfaceCard style={{ padding: 0, overflow: 'hidden' }}>
                  {rows.map((r, i) => (
                    <TouchableOpacity
                      key={r.key}
                      onPress={() => choose(r.key)}
                      accessibilityRole="button"
                      accessibilityState={{ selected: section === r.key }}
                      style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.lg, borderTopWidth: i ? 1 : 0, borderTopColor: colors.line, backgroundColor: section === r.key ? colors.accentTint : undefined }}
                    >
                      <View style={{ flex: 1 }}>
                        <CustomText variant="bodyStrong">{r.title}</CustomText>
                        <CustomText variant="caption" color={r.ok ? colors.inkMuted : colors.error} numberOfLines={2}>{r.detail}</CustomText>
                      </View>
                      {r.ok ? <Icon icon={generalIcons.check} size={18} color={colors.success} strokeWidth={3} /> : <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: colors.error }} />}
                    </TouchableOpacity>
                  ))}
                </SurfaceCard>
              </ScrollView>
              <PlanSaveFooter mode={mode} onDone={done} />
            </View>
            {/* 2. The chosen part */}
            <View style={{ ...slotStyle(1), borderRightWidth: openWorkout ? 1 : 0, borderRightColor: colors.line }}>
              <ColumnHeader title={titleOf} />
              {section === 'basics' && <PlanBasicsStep mode={mode} embedded />}
              {section === 'workouts' && <PlanWorkoutsStep mode={mode} embedded onOpenWorkout={setWorkoutId} openWorkoutId={openWorkout} />}
              {section === 'schedule' && <PlanScheduleStep mode={mode} embedded />}
              {section === 'review' && (
                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: spacing.lg, gap: spacing.lg }}>
                  <View>
                    <CustomText variant="heading">{draft.name.trim() || 'Untitled plan'}</CustomText>
                    {draft.description ? <CustomText variant="body" color={colors.inkMuted}>{draft.description}</CustomText> : null}
                  </View>
                  {/* One banner per thing still missing; a tap opens the part it belongs to. */}
                  {problems.map(p => (
                    <TouchableOpacity key={p.message} onPress={() => choose(sectionOf(p))} accessibilityRole="button" style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md, borderRadius: 12, backgroundColor: colors.accentTint }}>
                      <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: colors.error }} />
                      <CustomText variant="bodyStrong" style={{ flex: 1 }}>{p.message}</CustomText>
                      <CustomText variant="label" color={colors.accent}>Open {rows.find(r => r.key === sectionOf(p))?.title}</CustomText>
                      <Icon icon={directionIcons.angleRight} size={16} color={colors.accent} />
                    </TouchableOpacity>
                  ))}
                  <PlanSummaryCard plan={draft} stacked />
                </ScrollView>
              )}
            </View>
            {/* 3. The open workout's exercises */}
            <View style={{ ...slotStyle(2), borderRightWidth: openEntry ? 1 : 0, borderRightColor: colors.line }}>
              {openWorkout && <WorkoutEditor key={openWorkout} workoutId={openWorkout} embedded onOpenEntry={setEntryId} openEntryId={openEntry} />}
            </View>
            {/* 4. The open exercise's prescription */}
            <View style={slotStyle(3)}>
              {openWorkout && openEntry && (
                <>
                  <ColumnHeader title={draft.workouts.find(w => w.id === openWorkout)?.exercises.find(e => e.id === openEntry)?.exerciseName ?? 'Exercise'} />
                  <ExerciseEntry key={openEntry} workoutId={openWorkout} entryId={openEntry} embedded onDone={() => setEntryId(null)} />
                </>
              )}
            </View>
          </Animated.View>
        )}
      </View>
    </SafeAreaView>
  );
};
