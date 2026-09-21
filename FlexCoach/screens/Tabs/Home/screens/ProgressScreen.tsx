import React from 'react';
import { ScrollView, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '../../../../data/auth/AuthProvider';
import { useInsights } from '../../../../data/hooks/useInsights';
import { kgToLb } from '../../../../data/engine/units';
import { BarChart } from '../../../../components/charts/BarChart';
import { compactNumber } from '../../../../components/charts/scale';
import { loggedExercises } from '../../../../data/engine/insights';
import { getCatalogExercise } from '../../../../data/catalog/exerciseCatalog';
import { CustomText } from '../../../../components/text/customText';
import { SurfaceCard } from '../../../../components/cards/SurfaceCard';
import { Icon } from '../../../../components/icons/Icon';
import { directionIcons } from '../../../../components/icons/icon-library';
import { MuscleMap } from '../../../../components/anatomy/MuscleMap';
import { shortDate as sd } from '../../../../components/charts/scale';
const shortDate = sd;
import { useTheme } from '../../../../theme';
import { HomeStackParams } from '../HomeStack';

/** Every exercise with logged sets; tap one for its charts. */
export const ProgressScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<HomeStackParams>>();
  const { colors, spacing } = useTheme();
  const ins = useInsights();
  const { profile } = useAuth();
  const unit = profile?.weightUnit ?? 'lb';
  const items = loggedExercises(ins.sessions);
  const toUnit = (kg: number) => (unit === 'lb' ? kgToLb(kg) : kg);

  return (
    <SafeAreaView edges={['bottom', 'left', 'right']} style={{ flex: 1, backgroundColor: colors.ground }}>
      <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.md }}>
        <SurfaceCard>
          <CustomText variant="heading" style={{ marginBottom: spacing.sm }}>Weekly volume</CustomText>
          <BarChart
            bars={ins.weeks.map(w => ({ label: shortDate(w.weekStart).replace(' ', '\u00a0'), value: toUnit(w.volumeKg), detail: `This week: ${w.sessions} workout${w.sessions === 1 ? '' : 's'} · ${w.sets} sets · ${compactNumber(toUnit(w.volumeKg))} ${unit}` }))}
            format={v => compactNumber(v)}
          />
          <CustomText variant="caption" color={colors.inkMuted} style={{ marginTop: spacing.xs }}>Weight × reps per week, in {unit}.</CustomText>
        </SurfaceCard>
        <CustomText variant="body" color={colors.inkMuted}>Pick an exercise to see how it's moving over time.</CustomText>
        <SurfaceCard style={{ padding: 0 }}>
          {items.map((it, i) => {
            const cat = getCatalogExercise(it.exerciseId);
            return (
              <TouchableOpacity
                key={it.exerciseId}
                onPress={() => navigation.navigate('ExerciseProgressScreen', { exerciseId: it.exerciseId, exerciseName: it.exerciseName })}
                style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.md, paddingHorizontal: spacing.md, borderTopWidth: i ? 1 : 0, borderTopColor: colors.line }}
              >
                {cat && <MuscleMap primary={cat.primaryMuscles} secondary={cat.secondaryMuscles} height={56} views="auto" />}
                <View style={{ flex: 1 }}>
                  <CustomText variant="bodyStrong">{it.exerciseName}</CustomText>
                  <CustomText variant="caption" color={colors.inkMuted}>{it.sessions} session{it.sessions === 1 ? '' : 's'} · last {shortDate(it.lastDate)}</CustomText>
                </View>
                <Icon icon={directionIcons.angleRight} size={20} color={colors.inactive} />
              </TouchableOpacity>
            );
          })}
          {items.length === 0 && <CustomText variant="body" color={colors.inkMuted} style={{ padding: spacing.lg }}>Nothing logged yet.</CustomText>}
        </SurfaceCard>
      </ScrollView>
    </SafeAreaView>
  );
};
