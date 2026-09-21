import React from 'react';
import { ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RouteProp, useRoute } from '@react-navigation/native';
import { useAuth } from '../../../../data/auth/AuthProvider';
import { useInsights } from '../../../../data/hooks/useInsights';
import { exerciseHistory } from '../../../../data/engine/insights';
import { formatDuration, formatWeight, kgToLb, toDisplayWeight } from '../../../../data/engine/units';
import { getCatalogExercise } from '../../../../data/catalog/exerciseCatalog';
import { CustomText } from '../../../../components/text/customText';
import { SurfaceCard } from '../../../../components/cards/SurfaceCard';
import { LineChart } from '../../../../components/charts/LineChart';
import { StatTile } from '../../../../components/charts/StatTile';
import { compactNumber } from '../../../../components/charts/scale';
import { MuscleMap } from '../../../../components/anatomy/MuscleMap';
import { useTheme } from '../../../../theme';
import { HomeStackParams } from '../HomeStack';

export const ExerciseProgressScreen = () => {
  const { params } = useRoute<RouteProp<HomeStackParams, 'ExerciseProgressScreen'>>();
  const { colors, spacing } = useTheme();
  const { profile } = useAuth();
  const unit = profile?.weightUnit ?? 'lb';
  const ins = useInsights();
  const history = exerciseHistory(ins.sessions, params.exerciseId);
  const cat = getCatalogExercise(params.exerciseId);
  const latest = history[history.length - 1];
  const weighted = history.some(h => h.topWeightKg !== null);
  const timed = !weighted && history.some(h => h.bestDurationSec !== null);
  const disp = (kg: number) => (unit === 'lb' ? kgToLb(kg) : kg); // exact; labels round
  const fmtW = (v: number) => `${Math.round(v * 10) / 10}`;

  const chart = (label: string, points: { date: string; value: number }[], format: (v: number) => string, note: string) =>
    points.length >= 2 ? (
      <SurfaceCard>
        <CustomText variant="heading" style={{ marginBottom: spacing.sm }}>{label}</CustomText>
        <LineChart points={points} format={format} />
        <CustomText variant="caption" color={colors.inkMuted} style={{ marginTop: spacing.xs }}>{note}</CustomText>
      </SurfaceCard>
    ) : null;

  return (
    <SafeAreaView edges={['bottom', 'left', 'right']} style={{ flex: 1, backgroundColor: colors.ground }}>
      <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.lg }}>
        {cat && (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
            <MuscleMap primary={cat.primaryMuscles} secondary={cat.secondaryMuscles} height={80} views="auto" />
            <View style={{ flex: 1 }}>
              <CustomText variant="caption" color={colors.inkMuted}>{cat.primaryMuscles.join(', ')}</CustomText>
              <CustomText variant="caption" color={colors.inkMuted}>{history.length} session{history.length === 1 ? '' : 's'} logged</CustomText>
            </View>
          </View>
        )}
        {latest && (
          <View style={{ flexDirection: 'row', gap: spacing.sm }}>
            {weighted && <StatTile label="Top set" value={formatWeight(latest.topWeightKg, unit)} />}
            {weighted && latest.estOneRepMaxKg !== null && <StatTile label="Est. 1RM" value={formatWeight(latest.estOneRepMaxKg, unit)} delta="Epley" />}
            {timed && <StatTile label="Best hold" value={formatDuration(latest.bestDurationSec)} />}
            <StatTile label="Last reps" value={String(latest.totalReps)} />
          </View>
        )}
        {weighted && chart('Top set weight', history.filter(h => h.topWeightKg !== null).map(h => ({ date: h.date, value: disp(h.topWeightKg!) })), fmtW, `Heaviest completed set each session, in ${unit}.`)}
        {weighted && chart('Estimated one-rep max', history.filter(h => h.estOneRepMaxKg !== null).map(h => ({ date: h.date, value: disp(h.estOneRepMaxKg!) })), fmtW, 'Epley formula from your best set. Rises when weight or reps go up.')}
        {timed && chart('Best hold', history.filter(h => h.bestDurationSec !== null).map(h => ({ date: h.date, value: h.bestDurationSec! })), v => formatDuration(v), 'Longest completed hold each session.')}
        {chart('Volume per session', history.map(h => ({ date: h.date, value: unit === 'lb' ? kgToLb(h.volumeKg) : h.volumeKg })), v => compactNumber(v), `Weight × reps, in ${unit}.`)}
        {history.length < 2 && <CustomText variant="body" color={colors.inkMuted}>Log this exercise a couple more times to see trends.</CustomText>}
      </ScrollView>
    </SafeAreaView>
  );
};
