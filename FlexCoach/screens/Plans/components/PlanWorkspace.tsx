import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Alert, ScrollView, TouchableOpacity, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { ColumnHeader } from './ColumnHeader';
import { HeaderButton } from '../../../components/headers/HeaderButton';
import { useAuth } from '../../../data/auth/AuthProvider';
import { useWorkoutHome } from '../../../data/hooks/useWorkoutHome';
import { saveActivePlan, savePlan } from '../../../data/services/planService';
import { planRepository } from '../../../data/repositories/planRepository';
import { useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { validatePlan } from '../../../data/services/planService';
import { PlanProblem } from '../../../data/services/planService';
import { SafeAreaView } from '../../../components/layout/SafeAreaView';
import { CustomText } from '../../../components/text/customText';
import { SurfaceCard } from '../../../components/cards/SurfaceCard';
import { Icon } from '../../../components/icons/Icon';
import { directionIcons, generalIcons } from '../../../components/icons/icon-library';
import { useTheme } from '../../../theme';
import { PlansStackParams } from '../PlansStack';
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
export const PlanWorkspace = ({ mode, initial = 'basics', onDone }: { mode: 'create' | 'edit'; initial?: PlanSection; onDone: () => void }) => {
  const navigation = useNavigation<NativeStackNavigationProp<PlansStackParams>>();
  const { colors, spacing } = useTheme();
  const { uid } = useAuth();
  const home = useWorkoutHome();
  const { draft, original, clear, stopAutosave } = usePlanEditor();
  const [section, setSection] = useState<PlanSection>(initial);
  // The workout whose exercises fill the third column, if one is open; it closes with its workout, or when another part is chosen.
  const [workoutId, setWorkoutId] = useState<string | null>(null);
  const openWorkout = draft?.workouts.find(w => w.id === workoutId) ? workoutId : null;
  // The exercise whose prescription fills the fourth column, if one is open.
  const [entryId, setEntryId] = useState<string | null>(null);
  const openEntry = openWorkout && draft?.workouts.find(w => w.id === openWorkout)?.exercises.some(e => e.id === entryId) ? entryId : null;
  const choose = (next: PlanSection) => {
    setSection(next);
    setWorkoutId(null);
    setEntryId(null);
  };
  // How many columns deep: the parts, a workout, an exercise. Two columns are in view; only the left one has a back chevron, one step back.
  const level = openEntry ? 2 : openWorkout ? 1 : 0;
  // The columns slide as a strip: one column's width to the left per level.
  const [width, setWidth] = useState(0);
  const half = width / 2;
  const shift = useSharedValue(0);
  useEffect(() => {
    shift.value = withTiming(level * half, { duration: 280, easing: Easing.out(Easing.cubic) });
  }, [level, half, shift]);
  const strip = useAnimatedStyle(() => ({ transform: [{ translateX: -shift.value }] }));

  // The way back is ours: the native back and the swipe would pop the screen before any question could be asked, so they
  // are off, and the header's left button (back, or close when this is the sheet's first screen) asks first. It only
  // shows while the parts are in view; deeper in, the columns' own chevrons lead.
  const route = useRoute();
  const first = navigation.getState().routes[0]?.key === route.key;
  const draftRef = useRef(draft);
  draftRef.current = draft;
  const originalRef = useRef(original);
  originalRef.current = original;
  const cycleRef = useRef(home.cycle);
  cycleRef.current = home.cycle;
  const leaveScreen = useCallback(() => (first ? navigation.getParent()?.goBack() : navigation.goBack()), [first, navigation]);
  const askLeave = useCallback(() => {
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
  }, [mode, uid, clear, stopAutosave, leaveScreen]);
  useLayoutEffect(() => {
    navigation.setOptions({
      title: mode === 'create' ? 'New plan' : 'Edit plan',
      headerBackVisible: false,
      gestureEnabled: false,
      headerLeft: level === 0 ? () => <HeaderButton icon={first ? generalIcons.xMark : directionIcons.angleLeft} accessibilityLabel={first ? 'Close' : 'Back'} onPress={askLeave} /> : () => null,
    });
  }, [navigation, mode, level, first, askLeave]);
  const done = () => {
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
            <View style={{ width: half, borderRightWidth: 1, borderRightColor: colors.line }}>
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
            <View style={{ width: half, borderRightWidth: openWorkout ? 1 : 0, borderRightColor: colors.line }}>
              <ColumnHeader title={titleOf} onBack={level === 1 ? () => setWorkoutId(null) : undefined} />
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
            <View style={{ width: half, borderRightWidth: openEntry ? 1 : 0, borderRightColor: colors.line }}>
              {openWorkout && <WorkoutEditor key={openWorkout} workoutId={openWorkout} embedded onBack={level === 2 ? () => setEntryId(null) : undefined} onOpenEntry={setEntryId} openEntryId={openEntry} />}
            </View>
            {/* 4. The open exercise's prescription */}
            <View style={{ width: half }}>
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
