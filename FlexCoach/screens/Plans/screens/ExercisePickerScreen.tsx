import React, { useCallback, useMemo, useState } from 'react';
import { FlatList, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Exercise, MuscleGroup } from '../../../data/models';
import { MUSCLE_GROUPS, searchCatalog } from '../../../data/catalog/exerciseCatalog';
import { newEntry } from '../../../data/services/planService';
import { CustomText } from '../../../components/text/customText';
import { TextField } from '../../../components/inputs/TextField';
import { ChoiceChips } from '../../../components/inputs/ChoiceChips';
import { Icon } from '../../../components/icons/Icon';
import { generalIcons } from '../../../components/icons/icon-library';
import { useTheme } from '../../../theme';
import { MuscleMap } from '../../../components/anatomy/MuscleMap';
import { PlansStackParams } from '../PlansStack';
import { usePlanEditor } from '../PlanEditorContext';

const title = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

const ROW_HEIGHT = 84;

interface RowProps {
  item: Exercise;
  inWorkout: boolean;
  onOpen: (ex: Exercise) => void;
  onAdd: (ex: Exercise) => void;
}

/** Memoised so the long list only re-renders rows whose data changed. */
const ExerciseRow = React.memo(({ item, inWorkout, onOpen, onAdd }: RowProps) => {
  const { colors, spacing, radius } = useTheme();
  return (
    <View style={{ height: ROW_HEIGHT, flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
      <TouchableOpacity onPress={() => onOpen(item)} style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
        <MuscleMap primary={item.primaryMuscles} secondary={item.secondaryMuscles} height={64} views="auto" />
        <View style={{ flex: 1 }}>
          <CustomText variant="bodyStrong" numberOfLines={1}>{item.name}</CustomText>
          <CustomText variant="caption" color={colors.inkMuted} numberOfLines={2}>
            {item.primaryMuscles.map(title).join(', ')}{item.equipment ? ` · ${title(item.equipment)}` : ''}{inWorkout ? ' · added' : ''}
          </CustomText>
        </View>
      </TouchableOpacity>
      <TouchableOpacity
        onPress={() => onAdd(item)}
        disabled={inWorkout}
        hitSlop={8}
        style={{ width: 40, height: 40, borderRadius: radius.sm, backgroundColor: inWorkout ? colors.surfaceRaised : colors.accentTint, alignItems: 'center', justifyContent: 'center' }}
      >
        <Icon icon={inWorkout ? generalIcons.check : generalIcons.plus} size={20} color={inWorkout ? colors.inkMuted : colors.accent} strokeWidth={2.5} />
      </TouchableOpacity>
    </View>
  );
});

export const ExercisePickerScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<PlansStackParams>>();
  const { params } = useRoute<RouteProp<PlansStackParams, 'ExercisePickerScreen'>>();
  const { colors, spacing } = useTheme();
  const { draft, update } = usePlanEditor();
  const [query, setQuery] = useState('');
  const [muscle, setMuscle] = useState<MuscleGroup | 'all'>('all');

  const workout = draft?.workouts.find(w => w.id === params.workoutId);
  const already = useMemo(() => new Set(workout?.exercises.map(e => e.exerciseId) ?? []), [workout]);

  const results = useMemo(
    () => searchCatalog({ query, muscle: muscle === 'all' ? undefined : muscle }).slice(0, 120),
    [query, muscle],
  );

  const workoutId = params.workoutId;
  const add = useCallback(
    (ex: Exercise) => {
      update(p => ({
        ...p,
        workouts: p.workouts.map(w => (w.id === workoutId ? { ...w, exercises: [...w.exercises, newEntry(ex, w.exercises.length, p.goal)] } : w)),
      }));
      navigation.goBack();
    },
    [update, navigation, workoutId],
  );
  const open = useCallback((ex: Exercise) => navigation.navigate('ExerciseDetailScreen', { exerciseId: ex.id, addToWorkoutId: workoutId }), [navigation, workoutId]);

  if (!draft || !workout) return null;

  return (
    <SafeAreaView edges={['bottom', 'left', 'right']} style={{ flex: 1, backgroundColor: colors.ground }}>
      <View style={{ padding: spacing.lg, gap: spacing.md }}>
        <TextField id="exercise-search" placeholder="Search 876 exercises" value={query} onChangeText={setQuery} autoFocus autoCorrect={false} returnKeyType="search" />
        <ChoiceChips<MuscleGroup | 'all'>
          scroll
          options={[{ value: 'all', label: 'All' }, ...MUSCLE_GROUPS.map(m => ({ value: m, label: title(m) }))]}
          value={muscle}
          onChange={setMuscle}
        />
      </View>
      <CustomText variant="caption" color={colors.inkMuted} style={{ paddingHorizontal: spacing.lg, paddingBottom: spacing.sm }}>
        Tap an exercise to see how it's done, or + to add it straight away.
      </CustomText>
      <FlatList
        data={results}
        keyExtractor={e => e.id}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingBottom: spacing.xl }}
        ItemSeparatorComponent={() => <View style={{ height: 1, backgroundColor: colors.line }} />}
        ListEmptyComponent={<CustomText variant="body" color={colors.inkMuted} centered style={{ padding: spacing.xl }}>No exercises match.</CustomText>}
        getItemLayout={(_, index) => ({ length: ROW_HEIGHT + 1, offset: (ROW_HEIGHT + 1) * index, index })}
        initialNumToRender={10}
        maxToRenderPerBatch={8}
        windowSize={7}
        removeClippedSubviews
        renderItem={({ item }) => <ExerciseRow item={item} inWorkout={already.has(item.id)} onOpen={open} onAdd={add} />}
      />
    </SafeAreaView>
  );
};
