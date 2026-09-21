import React from 'react';
import { ScrollView, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '../../../../data/auth/AuthProvider';
import { useInsights } from '../../../../data/hooks/useInsights';
import { muscleWeeklySeries } from '../../../../data/engine/insights';
import { kgToLb } from '../../../../data/engine/units';
import { getCatalogExercise } from '../../../../data/catalog/exerciseCatalog';
import { MuscleGroup } from '../../../../data/models';
import { CustomText } from '../../../../components/text/customText';
import { SurfaceCard } from '../../../../components/cards/SurfaceCard';
import { StatTile } from '../../../../components/charts/StatTile';
import { BarChart } from '../../../../components/charts/BarChart';
import { compactNumber, shortDate } from '../../../../components/charts/scale';
import { MuscleMap } from '../../../../components/anatomy/MuscleMap';
import { Icon } from '../../../../components/icons/Icon';
import { directionIcons } from '../../../../components/icons/icon-library';
import { useTheme } from '../../../../theme';
import { HomeStackParams } from '../HomeStack';

export const MuscleDetailScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<HomeStackParams>>();
  const { params } = useRoute<RouteProp<HomeStackParams, 'MuscleDetailScreen'>>();
  const { colors, spacing } = useTheme();
  const { profile } = useAuth();
  const unit = profile?.weightUnit ?? 'lb';
  const ins = useInsights();
  const toUnit = (kg: number) => (unit === 'lb' ? kgToLb(kg) : kg);
  const weeks = muscleWeeklySeries(ins.sessions, params.muscle, id => getCatalogExercise(id)?.primaryMuscles ?? [], ins.todayDate, 8);
  const month = ins.muscles30d.find(m => m.muscle === params.muscle);
  const label = (w: { weekStart: string }) => shortDate(w.weekStart).replace(' ', ' ');

  return (
    <SafeAreaView edges={['bottom', 'left', 'right']} style={{ flex: 1, backgroundColor: colors.ground }}>
      <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.lg }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
          <MuscleMap primary={[params.muscle as MuscleGroup]} height={90} views="auto" />
          <View style={{ flex: 1, flexDirection: 'row', gap: spacing.sm }}>
            <StatTile label="Sets, 30d" value={String(month?.sets ?? 0)} />
            <StatTile label={`Volume ${unit}`} value={compactNumber(toUnit(month?.volumeKg ?? 0))} delta="30 days" />
          </View>
        </View>
        <SurfaceCard>
          <CustomText variant="heading" style={{ marginBottom: spacing.sm }}>Sets per week</CustomText>
          <BarChart bars={weeks.map(w => ({ label: label(w), value: w.sets }))} format={v => String(Math.round(v))} height={150} />
        </SurfaceCard>
        <SurfaceCard>
          <CustomText variant="heading" style={{ marginBottom: spacing.sm }}>Volume per week</CustomText>
          <BarChart bars={weeks.map(w => ({ label: label(w), value: toUnit(w.volumeKg) }))} format={v => compactNumber(v)} height={150} />
          <CustomText variant="caption" color={colors.inkMuted} style={{ marginTop: spacing.xs }}>Weight × reps, in {unit}, for exercises where this is the primary muscle.</CustomText>
        </SurfaceCard>
        {month && month.exercises.length > 0 && (
          <SurfaceCard style={{ paddingVertical: 0 }}>
            {month.exercises.map((e, i) => (
              <TouchableOpacity
                key={e.exerciseId}
                onPress={() => navigation.navigate('ExerciseProgressScreen', { exerciseId: e.exerciseId, exerciseName: e.exerciseName })}
                style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.md, gap: spacing.md, borderTopWidth: i ? 1 : 0, borderTopColor: colors.line }}
              >
                <View style={{ flex: 1 }}>
                  <CustomText variant="bodyStrong">{e.exerciseName}</CustomText>
                  <CustomText variant="caption" color={colors.inkMuted}>{e.sets} set{e.sets === 1 ? '' : 's'} · {e.reps} reps · {compactNumber(toUnit(e.volumeKg))} {unit}</CustomText>
                </View>
                <Icon icon={directionIcons.angleRight} size={18} color={colors.inactive} />
              </TouchableOpacity>
            ))}
          </SurfaceCard>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};
