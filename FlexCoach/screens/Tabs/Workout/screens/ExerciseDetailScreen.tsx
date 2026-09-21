import React from 'react';
import { Image, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RouteProp, useRoute } from '@react-navigation/native';
import { getCatalogExercise } from '../../../../data/catalog/exerciseCatalog';
import { MuscleMap } from '../../../../components/anatomy/MuscleMap';
import { CustomText } from '../../../../components/text/customText';
import { useTheme } from '../../../../theme';
import { WorkoutStackParams } from '../WorkoutStack';
import { Card } from '../components/Card';

const title = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

const Chip = ({ label }: { label: string }) => {
  const { colors, radius, spacing } = useTheme();
  return (
    <View style={{ backgroundColor: colors.surfaceRaised, borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: spacing.xs }}>
      <CustomText variant="caption" color={colors.ink}>{label}</CustomText>
    </View>
  );
};

/**
 * How-to for a catalog exercise: muscles worked, the two demonstration
 * photos, and step-by-step instructions. Video comes later.
 */
export const ExerciseDetailScreen = () => {
  const { params } = useRoute<RouteProp<WorkoutStackParams, 'ExerciseDetailScreen'>>();
  const { colors, spacing, radius } = useTheme();
  const ex = getCatalogExercise(params.exerciseId);

  if (!ex) {
    return (
      <SafeAreaView edges={['bottom']} style={{ flex: 1, backgroundColor: colors.ground, padding: spacing.lg }}>
        <CustomText variant="body" color={colors.inkMuted}>This exercise isn't in the catalog.</CustomText>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['bottom', 'left', 'right']} style={{ flex: 1, backgroundColor: colors.ground }}>
      <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.lg }}>
        <View style={{ gap: spacing.sm }}>
          <CustomText variant="title">{ex.name}</CustomText>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
            {ex.equipment && <Chip label={title(ex.equipment)} />}
            {ex.level && <Chip label={title(ex.level)} />}
            <Chip label={title(ex.category)} />
          </View>
        </View>

        <Card>
          <CustomText variant="overline" color={colors.inkMuted} style={{ marginBottom: spacing.md }}>Muscles worked</CustomText>
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

        {ex.images.length > 0 && (
          <View style={{ flexDirection: 'row', gap: spacing.sm }}>
            {ex.images.slice(0, 2).map((uri, i) => (
              <View key={uri} style={{ flex: 1, gap: spacing.xs }}>
                <Image source={{ uri }} resizeMode="cover" style={{ width: '100%', aspectRatio: 4 / 3, borderRadius: radius.md, backgroundColor: colors.surfaceRaised }} />
                <CustomText variant="caption" color={colors.inkMuted} centered>{i === 0 ? 'Start' : 'Finish'}</CustomText>
              </View>
            ))}
          </View>
        )}

        <View style={{ gap: spacing.sm }}>
          <CustomText variant="heading">How to do it</CustomText>
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
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};
