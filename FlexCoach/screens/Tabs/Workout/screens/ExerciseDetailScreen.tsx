import React, { useLayoutEffect, useState } from 'react';
import { Image, Platform, ScrollView, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from '../../../../components/layout/SafeAreaView';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { newEntry } from '../../../../data/services/planService';
import { pickAdd, pickSwap } from '../components/swapChannel';
import { usePlanEditor } from '../../../Plans/PlanEditorContext';
import { useAuth } from '../../../../data/auth/AuthProvider';
import { PrimaryButton } from '../../../../components/buttons/PrimaryButton';
import { generalIcons } from '../../../../components/icons/icon-library';
import { getCatalogExercise } from '../../../../data/catalog/exerciseCatalog';
import { MuscleMap } from '../../../../components/anatomy/MuscleMap';
import { CustomText } from '../../../../components/text/customText';
import { useTheme } from '../../../../theme';
import { SurfaceCard as Card } from '../../../../components/cards/SurfaceCard';
import { PhotoViewer } from '../../../../components/media/PhotoViewer';
import { SegmentedPager } from '../../../../components/layout/SegmentedPager';
import { useSessionOrientation } from '../../../../navigation/useSessionOrientation';

const title = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

const Chip = ({ label }: { label: string }) => {
  const { colors, radius, spacing } = useTheme();
  return (
    <View style={{ backgroundColor: colors.surfaceRaised, borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: spacing.xs }}>
      <CustomText variant="caption" color={colors.ink}>{label}</CustomText>
    </View>
  );
};

type Section = 'howto' | 'muscles' | 'instructions';

/**
 * A catalog exercise, as a sheet titled with its name: the description and
 * the facts at a glance fixed at the top, then three swipeable sections,
 * the exercise in motion, the muscles worked, and the instructions, each
 * scrolling on its own.
 */
export const ExerciseDetailScreen = () => {
  useSessionOrientation();
  const { params } = useRoute<RouteProp<{ ExerciseDetailScreen: { exerciseId: string; knownAs?: string; addToWorkoutId?: string; addToSession?: boolean; swapForSessionExerciseId?: string } }, 'ExerciseDetailScreen'>>();
  const navigation = useNavigation<NativeStackNavigationProp<Record<string, object | undefined>>>();
  const { colors, spacing, radius } = useTheme();
  const ex = getCatalogExercise(params.exerciseId);
  // Shown only when it differs from the library's name: an old plan's "Air Bike" is the library's "Bicycle Crunch".
  const knownAs = params.knownAs && ex && params.knownAs.trim().toLowerCase() !== ex.name.trim().toLowerCase() ? params.knownAs.trim() : null;
  const editor = usePlanEditor();
  const { profile } = useAuth();
  const [viewing, setViewing] = useState<number | null>(null);
  const [section, setSection] = useState<Section>('howto');
  // The sheet carries the exercise's name, not a generic "How to".
  useLayoutEffect(() => {
    if (ex) navigation.setOptions({ title: ex.name });
  }, [navigation, ex]);
  const targetWorkout = params.addToWorkoutId ? editor.draft?.workouts.find(w => w.id === params.addToWorkoutId) : undefined;
  const alreadyAdded = !!targetWorkout && !!ex && targetWorkout.exercises.some(e => e.exerciseId === ex.id);

  const addToWorkout = () => {
    if (!ex || !targetWorkout) return;
    editor.update(p => ({
      ...p,
      workouts: p.workouts.map(w => (w.id === targetWorkout.id ? { ...w, exercises: [...w.exercises, newEntry(ex, w.exercises.length, p.goal, profile?.weightUnit ?? 'lb')] } : w)),
    }));
    // Pop the detail screen and the picker beneath it, back to the workout editor.
    navigation.pop(2);
  };

  // From a running workout's picker: the pick goes back through the swap channel and both screens pop, as the row's own button does.
  const sessionAction = ex && params.swapForSessionExerciseId ? { label: 'Swap', icon: generalIcons.swap, run: () => pickSwap(params.swapForSessionExerciseId!, ex) } : ex && params.addToSession ? { label: 'Add to this workout', icon: generalIcons.plus, run: () => pickAdd(ex) } : null;
  const runSessionAction = () => {
    sessionAction?.run();
    navigation.pop(2);
  };

  if (!ex) {
    return (
      <SafeAreaView edges={['bottom', 'left', 'right']} style={{ flex: 1, backgroundColor: colors.ground, padding: spacing.lg }}>
        <CustomText variant="body" color={colors.inkMuted}>This exercise isn't in the catalog.</CustomText>
      </SafeAreaView>
    );
  }

  const howTo = (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: spacing.lg, gap: spacing.md }}>
      {/* The licensed library's exercises play as an animation (the GIF on iOS, the WebP on Android); the old library's show their two photos. */}
      {ex.animation && (
        <Image source={{ uri: Platform.OS === 'android' ? ex.animation.webp : ex.animation.gif }} resizeMode="cover" accessibilityLabel={`${ex.name}, in motion`} style={{ width: '100%', aspectRatio: 1, borderRadius: radius.md, backgroundColor: '#FFFFFF' }} />
      )}
      {!ex.animation && ex.images.length > 0 && (
        <View style={{ flexDirection: 'row', gap: spacing.sm }}>
          {ex.images.slice(0, 2).map((uri, i) => (
            <TouchableOpacity key={uri} activeOpacity={0.8} onPress={() => setViewing(i)} accessibilityRole="imagebutton" accessibilityLabel={`Expand ${i === 0 ? 'start' : 'finish'} photo`} style={{ flex: 1, gap: spacing.xs }}>
              <Image source={{ uri }} resizeMode="cover" style={{ width: '100%', aspectRatio: 4 / 3, borderRadius: radius.md, backgroundColor: colors.surfaceRaised }} />
              <CustomText variant="caption" color={colors.inkMuted} centered>{i === 0 ? 'Start' : 'Finish'} · tap to expand</CustomText>
            </TouchableOpacity>
          ))}
        </View>
      )}
      {!ex.animation && ex.images.length === 0 && <CustomText variant="body" color={colors.inkMuted}>No demonstration for this one yet.</CustomText>}
    </ScrollView>
  );

  const muscles = (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: spacing.lg }}>
      <Card>
        <MuscleMap primary={ex.primaryMuscles} secondary={ex.secondaryMuscles} height={220} />
        <View style={{ flexDirection: 'row', gap: spacing.lg, marginTop: spacing.md, flexWrap: 'wrap' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
            <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: colors.accent }} />
            <CustomText variant="caption" color={colors.ink}>{ex.primaryMuscles.map(title).join(', ') || '—'}</CustomText>
          </View>
          {ex.secondaryMuscles.length > 0 && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
              <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: colors.accent, opacity: 0.4 }} />
              <CustomText variant="caption" color={colors.inkMuted}>{ex.secondaryMuscles.map(title).join(', ')}</CustomText>
            </View>
          )}
        </View>
      </Card>
    </ScrollView>
  );

  const instructions = (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: spacing.lg }}>
      <Card style={{ gap: spacing.md }}>
        {ex.instructions.map((step, i) => (
          <View key={i} style={{ flexDirection: 'row', gap: spacing.md }}>
            <View style={{ width: 26, height: 26, borderRadius: 13, backgroundColor: colors.accentTint, alignItems: 'center', justifyContent: 'center' }}>
              <CustomText variant="label" color={colors.accent}>{i + 1}</CustomText>
            </View>
            <View style={{ flex: 1 }}>
              <CustomText variant="body">{step}</CustomText>
            </View>
          </View>
        ))}
        {ex.instructions.length === 0 && <CustomText variant="body" color={colors.inkMuted}>No written instructions for this one yet.</CustomText>}
      </Card>
    </ScrollView>
  );

  return (
    <SafeAreaView edges={['bottom', 'left', 'right']} style={{ flex: 1, backgroundColor: colors.ground }}>
      {/* Fixed above the sections: what the exercise is, and its facts at a glance. */}
      <View style={{ paddingHorizontal: spacing.lg, paddingTop: spacing.md, gap: spacing.md }}>
        {(ex.description || knownAs) && (
          <View style={{ gap: spacing.xs }}>
            <CustomText variant="overline" color={colors.inkMuted}>Description</CustomText>
            {ex.description ? <CustomText variant="body">{ex.description}</CustomText> : null}
            {/* The name it carries in the lifter's plan or session when the library calls it something else, so the sheet reads as the exercise they tapped. */}
            {knownAs && <CustomText variant="caption" color={colors.inkMuted}>Also called {knownAs}</CustomText>}
          </View>
        )}
        <View style={{ gap: spacing.xs }}>
          <CustomText variant="overline" color={colors.inkMuted}>At a glance</CustomText>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
            {/* Three at most: equipment, level and type lead; one-side-at-a-time only when one of those is missing. */}
            {[ex.equipment && title(ex.equipment), ex.level && title(ex.level), title(ex.category), ex.unilateral ? 'One side at a time' : null]
              .filter((label): label is string => !!label)
              .slice(0, 3)
              .map(label => (
                <Chip key={label} label={label} />
              ))}
          </View>
        </View>
      </View>
      <View style={{ flex: 1, marginTop: spacing.lg }}>
        <SegmentedPager<Section>
          value={section}
          onChange={setSection}
          pages={[
            { value: 'howto', label: 'How to', render: () => howTo },
            { value: 'muscles', label: 'Muscles worked', render: () => muscles },
            { value: 'instructions', label: 'Instructions', render: () => instructions },
          ]}
        />
      </View>
      <PhotoViewer images={ex.images.slice(0, 2)} captions={['Start', 'Finish']} index={viewing} onClose={() => setViewing(null)} />
      {targetWorkout && (
        <View style={{ padding: spacing.lg, borderTopWidth: 1, borderTopColor: colors.line }}>
          <PrimaryButton label={alreadyAdded ? `Already in ${targetWorkout.name}` : `Add to ${targetWorkout.name}`} icon={generalIcons.plus} disabled={alreadyAdded} onPress={addToWorkout} />
        </View>
      )}
      {sessionAction && (
        <View style={{ padding: spacing.lg, borderTopWidth: 1, borderTopColor: colors.line }}>
          <PrimaryButton label={sessionAction.label} icon={sessionAction.icon} onPress={runSessionAction} />
        </View>
      )}
    </SafeAreaView>
  );
};
