import React, { useState } from 'react';
import { Alert, TouchableOpacity, View } from 'react-native';
import Animated, { useAnimatedRef } from 'react-native-reanimated';
import { SortableRows } from '../../../../components/lists/SortableRows';
import { Workout } from '../../../../data/models';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { newWorkout } from '../../../../data/services/planService';
import { CustomText } from '../../../../components/text/customText';
import { SurfaceCard } from '../../../../components/cards/SurfaceCard';
import { TextField } from '../../../../components/inputs/TextField';
import { ChoiceChips } from '../../../../components/inputs/ChoiceChips';
import { PrimaryButton } from '../../../../components/buttons/PrimaryButton';
import { Icon } from '../../../../components/icons/Icon';
import { generalIcons } from '../../../../components/icons/icon-library';
import { useTheme } from '../../../../theme';
import { EditorMode, PlansStackParams } from '../../routes';
import { StepRoot } from '../StepRoot';
import { usePlanEditor } from '../../PlanEditorContext';
import { StepFooter } from '../StepFooter';

const SUGGESTIONS = ['Push', 'Pull', 'Legs', 'Upper', 'Lower', 'Full body', 'Arms', 'Core'];

/** The step itself: its own screen on a phone, a pane of the workspace on a wide window. */
export const PlanWorkoutsStep = ({ mode, embedded = false, onOpenWorkout, openWorkoutId = null }: { mode: EditorMode; embedded?: boolean; /** Where a tapped workout goes on a wide window: the workspace's editor column rather than a pushed screen. */ onOpenWorkout?: (workoutId: string) => void; openWorkoutId?: string | null }) => {
  const navigation = useNavigation<NativeStackNavigationProp<PlansStackParams>>();
  const { colors, spacing } = useTheme();
  const { draft, update } = usePlanEditor();
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState('');
  const scrollRef = useAnimatedRef<Animated.ScrollView>();
  if (!draft) return null;

  const add = (n: string) => {
    const trimmed = n.trim();
    if (!trimmed) return;
    const w = newWorkout(trimmed, draft.workouts.length);
    update(p => ({ ...p, workouts: [...p.workouts, w] }));
    setName('');
    setAdding(false);
    openWorkout(w.id);
  };

  const openWorkout = (workoutId: string) => (onOpenWorkout ? onOpenWorkout(workoutId) : navigation.navigate('WorkoutEditorScreen', { workoutId }));

  const remove = (id: string, label: string) =>
    Alert.alert(`Remove ${label}?`, 'Its exercises are removed from this plan.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => update(p => ({ ...p, workouts: p.workouts.filter(w => w.id !== id).map((w, i) => ({ ...w, order: i })) })) },
    ]);

  const reorder = (ws: Workout[]) => update(p => ({ ...p, workouts: ws.map((w, i) => ({ ...w, order: i })) }));

  const empty = draft.workouts.filter(w => w.exercises.length === 0);
  const problem = draft.workouts.length === 0 ? 'Add at least one workout.' : empty.length ? `${empty.map(w => w.name).join(', ')} ${empty.length === 1 ? 'has' : 'have'} no exercises yet.` : null;
  const taken = new Set(draft.workouts.map(w => w.name.toLowerCase()));

  return (
    <StepRoot embedded={embedded}>
      <Animated.ScrollView ref={scrollRef} showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: spacing.lg, gap: spacing.lg}} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag">
        <CustomText variant="body" color={colors.inkMuted}>
          {mode === 'edit' ? 'Tap a workout to change its exercises, or drag to reorder.' : "Name each day you train, like Push, Pull or Legs. Next you'll pick the exercises for each one, then set which days they land on."}
        </CustomText>
        {draft.workouts.length > 0 && (
          <SurfaceCard style={{ padding: 0, overflow: 'hidden' }}>
            <SortableRows
              items={draft.workouts}
              keyOf={w => w.id}
              onReorder={reorder}
              scrollableRef={scrollRef}
              renderRow={w => (
                <View style={{ flexDirection: 'row', alignItems: 'center', borderLeftWidth: 3, borderLeftColor: openWorkoutId === w.id ? colors.accent : colors.transparent }}>
                  <TouchableOpacity onPress={() => openWorkout(w.id)} style={{ flex: 1, padding: spacing.lg }}>
                    <CustomText variant="bodyStrong">{w.name}</CustomText>
                    <CustomText variant="caption" color={w.exercises.length ? colors.inkMuted : colors.warning}>
                      {w.exercises.length ? `${w.exercises.length} exercise${w.exercises.length === 1 ? '' : 's'}` : 'No exercises yet'}
                    </CustomText>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => remove(w.id, w.name)} hitSlop={6} style={{ padding: spacing.sm }}>
                    <Icon icon={generalIcons.xMark} size={20} color={colors.inkMuted} />
                  </TouchableOpacity>
                </View>
              )}
            />
          </SurfaceCard>
        )}
        {adding ? (
          <SurfaceCard style={{ gap: spacing.md }}>
            <TextField id="workout-name" label="Workout name" placeholder="Push" hint="Type a name or pick one below. You'll add its exercises next." value={name} onChangeText={setName} autoFocus returnKeyType="done" onSubmitEditing={() => add(name)} />
            <ChoiceChips options={SUGGESTIONS.filter(s => !taken.has(s.toLowerCase())).map(s => ({ value: s, label: s }))} value={null} onChange={add} />
            <View style={{ flexDirection: 'row', gap: spacing.sm }}>
              <View style={{ flex: 1 }}><PrimaryButton label="Cancel" variant="quiet" onPress={() => { setAdding(false); setName(''); }} /></View>
              <View style={{ flex: 1 }}><PrimaryButton label="Add" onPress={() => add(name)} disabled={!name.trim()} /></View>
            </View>
          </SurfaceCard>
        ) : (
          <PrimaryButton label="Add workout" icon={generalIcons.plus} variant="outline" onPress={() => setAdding(true)} />
        )}
      </Animated.ScrollView>
      {!embedded && (mode === 'edit' ? (
        <StepFooter label="Done" problem={problem} onPress={() => navigation.goBack()} />
      ) : (
        <StepFooter label="Next: Schedule" problem={problem} onPress={() => navigation.navigate('PlanScheduleScreen', { mode })} />
      ))}
    </StepRoot>
  );
};
