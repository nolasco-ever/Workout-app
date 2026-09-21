import React, { useLayoutEffect, useState } from 'react';
import { TouchableOpacity, View } from 'react-native';
import Animated, { useAnimatedRef } from 'react-native-reanimated';
import { SortableRows } from '../../../components/lists/SortableRows';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useAuth } from '../../../data/auth/AuthProvider';
import { Workout, WorkoutExercise } from '../../../data/models';
import { formatDistance, formatDuration, formatWeight } from '../../../data/engine/units';
import { getCatalogExercise } from '../../../data/catalog/exerciseCatalog';
import { CustomText } from '../../../components/text/customText';
import { SurfaceCard } from '../../../components/cards/SurfaceCard';
import { TextField } from '../../../components/inputs/TextField';
import { PrimaryButton } from '../../../components/buttons/PrimaryButton';
import { Icon } from '../../../components/icons/Icon';
import { generalIcons } from '../../../components/icons/icon-library';
import { MuscleMap } from '../../../components/anatomy/MuscleMap';
import { useTheme } from '../../../theme';
import { PlansStackParams } from '../PlansStack';
import { usePlanEditor } from '../PlanEditorContext';

export const describeEntry = (e: WorkoutExercise, unit: 'kg' | 'lb', dist: 'km' | 'mi'): string => {
  const w = e.startingWeightKg !== null ? ` @ ${formatWeight(e.startingWeightKg, unit)}` : '';
  switch (e.measurement) {
    case 'weight_reps':
      return `${e.sets} × ${e.repRangeMin}–${e.repRangeMax}${w}`;
    case 'reps':
      return `${e.sets} × ${e.repRangeMin}–${e.repRangeMax}${e.startingWeightKg ? ` +${formatWeight(e.startingWeightKg, unit)}` : ' bodyweight'}`;
    case 'time':
      return `${e.sets} × ${formatDuration(e.startingDurationSec)}${w}`;
    case 'distance_time':
      return `${formatDistance(e.startingDistanceM, dist)} in ${formatDuration(e.startingDurationSec)}`;
  }
};

export const WorkoutEditorScreen = () => {
  const navigation = useNavigation<StackNavigationProp<PlansStackParams>>();
  const { params } = useRoute<RouteProp<PlansStackParams, 'WorkoutEditorScreen'>>();
  const { colors, spacing } = useTheme();
  const { profile } = useAuth();
  const { draft, update } = usePlanEditor();
  const workout = draft?.workouts.find(w => w.id === params.workoutId);
  const [renaming, setRenaming] = useState(false);
  const scrollRef = useAnimatedRef<Animated.ScrollView>();

  useLayoutEffect(() => {
    if (workout) navigation.setOptions({ headerTitle: workout.name });
  }, [navigation, workout]);

  if (!draft || !workout) return null;
  const unit = profile?.weightUnit ?? 'lb';
  const dist = profile?.distanceUnit ?? 'mi';

  const setWorkout = (fn: (w: Workout) => Workout) =>
    update(p => ({ ...p, workouts: p.workouts.map(w => (w.id === workout.id ? fn(w) : w)) }));

  const reorder = (es: WorkoutExercise[]) => setWorkout(w => ({ ...w, exercises: es.map((e, i) => ({ ...e, order: i })) }));

  const removeEntry = (id: string) => setWorkout(w => ({ ...w, exercises: w.exercises.filter(e => e.id !== id).map((e, i) => ({ ...e, order: i })) }));

  const primary = [...new Set(workout.exercises.flatMap(e => getCatalogExercise(e.exerciseId)?.primaryMuscles ?? []))];
  const secondary = [...new Set(workout.exercises.flatMap(e => getCatalogExercise(e.exerciseId)?.secondaryMuscles ?? []))].filter(m => !primary.includes(m));

  return (
    <SafeAreaView edges={['bottom', 'left', 'right']} style={{ flex: 1, backgroundColor: colors.ground }}>
      <Animated.ScrollView ref={scrollRef} contentContainerStyle={{ padding: spacing.lg, gap: spacing.lg }} keyboardShouldPersistTaps="handled">
        {renaming ? (
          <TextField
            id="rename-workout"
            label="Workout name"
            value={workout.name}
            autoFocus
            returnKeyType="done"
            onChangeText={name => setWorkout(w => ({ ...w, name }))}
            onBlur={() => setRenaming(false)}
            onSubmitEditing={() => setRenaming(false)}
          />
        ) : (
          <TouchableOpacity onPress={() => setRenaming(true)} style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
            <CustomText variant="title">{workout.name}</CustomText>
            <Icon icon={generalIcons.penToSquare} size={18} color={colors.inkMuted} />
          </TouchableOpacity>
        )}

        {workout.exercises.length > 0 && (
          <SurfaceCard style={{ padding: 0, overflow: 'hidden' }}>
            <SortableRows
              items={[...workout.exercises].sort((a, b) => a.order - b.order)}
              keyOf={e => e.id}
              onReorder={reorder}
              scrollableRef={scrollRef}
              renderRow={e => {
                const cat = getCatalogExercise(e.exerciseId);
                return (
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <TouchableOpacity
                      onPress={() => navigation.navigate('ExerciseEntryScreen', { workoutId: workout.id, entryId: e.id })}
                      style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.md, paddingLeft: spacing.md }}
                    >
                      {cat && <MuscleMap primary={cat.primaryMuscles} secondary={cat.secondaryMuscles} height={56} views="auto" />}
                      <View style={{ flex: 1 }}>
                        <CustomText variant="bodyStrong" numberOfLines={1}>{e.exerciseName}</CustomText>
                        <CustomText variant="caption" color={colors.accent}>{describeEntry(e, unit, dist)}</CustomText>
                      </View>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => navigation.navigate('ExerciseDetailScreen', { exerciseId: e.exerciseId })} hitSlop={8} style={{ padding: spacing.sm }}>
                      <Icon icon={generalIcons.info} size={20} color={colors.inkMuted} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => removeEntry(e.id)} hitSlop={6} style={{ padding: spacing.sm }}>
                      <Icon icon={generalIcons.xMark} size={20} color={colors.inkMuted} />
                    </TouchableOpacity>
                  </View>
                );
              }}
            />
          </SurfaceCard>
        )}

        <PrimaryButton label="Add exercise" icon={generalIcons.plus} variant={workout.exercises.length ? 'outline' : 'filled'} onPress={() => navigation.navigate('ExercisePickerScreen', { workoutId: workout.id })} />

        {primary.length > 0 && (
          <SurfaceCard>
            <CustomText variant="overline" color={colors.inkMuted} style={{ marginBottom: spacing.md }}>This workout hits</CustomText>
            <MuscleMap primary={primary} secondary={secondary} height={170} />
            <View style={{ flexDirection: 'row', gap: spacing.lg, marginTop: spacing.md, flexWrap: 'wrap' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
                <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: colors.accent }} />
                <CustomText variant="caption">{primary.join(', ')}</CustomText>
              </View>
              {secondary.length > 0 && (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
                  <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: colors.accent, opacity: 0.4 }} />
                  <CustomText variant="caption" color={colors.inkMuted}>{secondary.join(', ')}</CustomText>
                </View>
              )}
            </View>
          </SurfaceCard>
        )}
      </Animated.ScrollView>
      <View style={{ padding: spacing.lg, borderTopWidth: 1, borderTopColor: colors.line }}>
        <PrimaryButton label="Done" onPress={() => navigation.goBack()} />
      </View>
    </SafeAreaView>
  );
};
