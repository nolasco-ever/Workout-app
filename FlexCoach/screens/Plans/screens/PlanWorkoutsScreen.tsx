import React, { useState } from 'react';
import { Alert, TouchableOpacity, View } from 'react-native';
import Animated, { useAnimatedRef } from 'react-native-reanimated';
import { SortableRows } from '../../../components/lists/SortableRows';
import { Workout } from '../../../data/models';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { newWorkout } from '../../../data/services/planService';
import { CustomText } from '../../../components/text/customText';
import { SurfaceCard } from '../../../components/cards/SurfaceCard';
import { TextField } from '../../../components/inputs/TextField';
import { ChoiceChips } from '../../../components/inputs/ChoiceChips';
import { PrimaryButton } from '../../../components/buttons/PrimaryButton';
import { Icon } from '../../../components/icons/Icon';
import { generalIcons } from '../../../components/icons/icon-library';
import { useTheme } from '../../../theme';
import { PlansStackParams } from '../PlansStack';
import { usePlanEditor } from '../PlanEditorContext';
import { StepFooter } from '../components/StepFooter';

const SUGGESTIONS = ['Push', 'Pull', 'Legs', 'Upper', 'Lower', 'Full body', 'Arms', 'Core'];

export const PlanWorkoutsScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<PlansStackParams>>();
  const { params } = useRoute<RouteProp<PlansStackParams, 'PlanWorkoutsScreen'>>();
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
    navigation.navigate('WorkoutEditorScreen', { workoutId: w.id });
  };

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
    <SafeAreaView edges={['bottom', 'left', 'right']} style={{ flex: 1, backgroundColor: colors.ground }}>
      <Animated.ScrollView ref={scrollRef} contentContainerStyle={{ padding: spacing.lg, gap: spacing.lg }} keyboardShouldPersistTaps="handled">
        <CustomText variant="body" color={colors.inkMuted}>
          Each workout is one training day, like Push or Legs. Add the days you rotate through, then fill each with exercises.
        </CustomText>
        {draft.workouts.length > 0 && (
          <SurfaceCard style={{ padding: 0, overflow: 'hidden' }}>
            <SortableRows
              items={draft.workouts}
              keyOf={w => w.id}
              onReorder={reorder}
              scrollableRef={scrollRef}
              renderRow={w => (
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <TouchableOpacity onPress={() => navigation.navigate('WorkoutEditorScreen', { workoutId: w.id })} style={{ flex: 1, padding: spacing.lg }}>
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
            <TextField id="workout-name" label="Workout name" placeholder="Push" value={name} onChangeText={setName} autoFocus returnKeyType="done" onSubmitEditing={() => add(name)} />
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
      <StepFooter label="Next: Schedule" problem={problem} onPress={() => navigation.navigate('PlanScheduleScreen', { mode: params.mode })} />
    </SafeAreaView>
  );
};
