import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '../../../data/auth/AuthProvider';
import { WorkoutExercise } from '../../../data/models';
import { fromDisplayDistance, fromDisplayWeight, parseNumber, toDisplayDistance, toDisplayWeight } from '../../../data/engine/units';
import { getCatalogExercise } from '../../../data/catalog/exerciseCatalog';
import { CustomText } from '../../../components/text/customText';
import { SurfaceCard } from '../../../components/cards/SurfaceCard';
import { TextField } from '../../../components/inputs/TextField';
import { Stepper } from '../../../components/inputs/Stepper';
import { PrimaryButton } from '../../../components/buttons/PrimaryButton';
import { MuscleMap } from '../../../components/anatomy/MuscleMap';
import { useTheme } from '../../../theme';
import { PlansStackParams } from '../PlansStack';
import { usePlanEditor } from '../PlanEditorContext';

const str = (n: number | null) => (n === null ? '' : String(n));

export const ExerciseEntryScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<PlansStackParams>>();
  const { params } = useRoute<RouteProp<PlansStackParams, 'ExerciseEntryScreen'>>();
  const { colors, spacing } = useTheme();
  const { profile } = useAuth();
  const { draft, update } = usePlanEditor();
  const unit = profile?.weightUnit ?? 'lb';
  const dist = profile?.distanceUnit ?? 'mi';

  const initial = draft?.workouts.find(w => w.id === params.workoutId)?.exercises.find(e => e.id === params.entryId);
  const [entry, setEntry] = useState<WorkoutExercise | undefined>(initial);
  const [weight, setWeight] = useState(str(toDisplayWeight(initial?.startingWeightKg ?? null, unit)));
  const [increment, setIncrement] = useState(str(toDisplayWeight(initial?.progression.weightIncrementKg ?? null, unit)));
  const [distance, setDistance] = useState(str(toDisplayDistance(initial?.startingDistanceM ?? null, dist)));
  const [duration, setDuration] = useState(str(initial?.startingDurationSec ?? null));

  if (!draft || !entry) return null;
  const catalog = getCatalogExercise(entry.exerciseId);
  const weighted = entry.measurement === 'weight_reps' || entry.measurement === 'reps' || entry.measurement === 'time';
  const repBased = entry.measurement === 'weight_reps' || entry.measurement === 'reps';

  const save = () => {
    const next: WorkoutExercise = {
      ...entry,
      startingWeightKg: weighted ? fromDisplayWeight(parseNumber(weight), unit) : null,
      startingDurationSec: entry.measurement === 'time' || entry.measurement === 'distance_time' ? parseNumber(duration) : null,
      startingDistanceM: entry.measurement === 'distance_time' ? fromDisplayDistance(parseNumber(distance), dist) : null,
      progression: { ...entry.progression, weightIncrementKg: fromDisplayWeight(parseNumber(increment), unit) ?? entry.progression.weightIncrementKg },
    };
    update(p => ({
      ...p,
      workouts: p.workouts.map(w => (w.id === params.workoutId ? { ...w, exercises: w.exercises.map(e => (e.id === next.id ? next : e)) } : w)),
    }));
    navigation.goBack();
  };

  return (
    <SafeAreaView edges={['bottom', 'left', 'right']} style={{ flex: 1, backgroundColor: colors.ground }}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }} keyboardVerticalOffset={100}>
        <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.lg }} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag">
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
            {catalog && <MuscleMap primary={catalog.primaryMuscles} secondary={catalog.secondaryMuscles} height={80} views="auto" />}
            <View style={{ flex: 1 }}>
              <CustomText variant="title">{entry.exerciseName}</CustomText>
              <CustomText variant="caption" color={colors.inkMuted}>{catalog?.primaryMuscles.join(', ')}</CustomText>
            </View>
          </View>

          <SurfaceCard>
            <CustomText variant="overline" color={colors.inkMuted} style={{ marginBottom: spacing.xs }}>Prescription</CustomText>
            <Stepper label="Sets" value={entry.sets} min={1} max={10} onChange={sets => setEntry({ ...entry, sets })} />
            {repBased && (
              <>
                <Stepper label="Reps, low end" value={entry.repRangeMin ?? 8} min={1} max={entry.repRangeMax ?? 30} onChange={v => setEntry({ ...entry, repRangeMin: v })} />
                <Stepper label="Reps, top end" value={entry.repRangeMax ?? 12} min={entry.repRangeMin ?? 1} max={50} onChange={v => setEntry({ ...entry, repRangeMax: v })} />
              </>
            )}
            <Stepper label="Rest between sets" value={entry.restSec} min={0} max={600} step={15} format={v => `${v}s`} onChange={restSec => setEntry({ ...entry, restSec })} />
          </SurfaceCard>

          <SurfaceCard style={{ gap: spacing.md }}>
            <CustomText variant="overline" color={colors.inkMuted}>Starting point</CustomText>
            {weighted && (
              <TextField
                id="entry-weight"
                label={entry.measurement === 'reps' ? 'Added weight (optional)' : 'Starting weight'}
                placeholder={entry.measurement === 'reps' ? 'Bodyweight' : 'Leave blank to enter on the day'}
                value={weight}
                onChangeText={setWeight}
                keyboardType="decimal-pad"
                suffix={unit}
              />
            )}
            {(entry.measurement === 'time' || entry.measurement === 'distance_time') && (
              <TextField id="entry-duration" label="Starting duration" value={duration} onChangeText={setDuration} keyboardType="number-pad" suffix="sec" />
            )}
            {entry.measurement === 'distance_time' && (
              <TextField id="entry-distance" label="Starting distance" value={distance} onChangeText={setDistance} keyboardType="decimal-pad" suffix={dist} />
            )}
            {repBased && (
              <TextField
                id="entry-increment"
                label="Weight jump when you hit the top of the range"
                value={increment}
                onChangeText={setIncrement}
                keyboardType="decimal-pad"
                suffix={unit}
                hint="Small for dumbbells and isolation work, bigger for squats and deadlifts."
              />
            )}
          </SurfaceCard>
        </ScrollView>
        <View style={{ padding: spacing.lg, borderTopWidth: 1, borderTopColor: colors.line }}>
          <PrimaryButton label="Save" onPress={save} />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};
