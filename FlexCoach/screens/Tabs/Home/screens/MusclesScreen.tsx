import React from 'react';
import { ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useInsights } from '../../../../data/hooks/useInsights';
import { MuscleGroup } from '../../../../data/models';
import { MUSCLE_GROUPS } from '../../../../data/catalog/exerciseCatalog';
import { CustomText } from '../../../../components/text/customText';
import { SurfaceCard } from '../../../../components/cards/SurfaceCard';
import { MuscleMap } from '../../../../components/anatomy/MuscleMap';
import { useTheme } from '../../../../theme';
import { HomeStackParams } from '../HomeStack';
import { useTabScrollInset } from '../../../../navigation/useTabBarInset';
import { MuscleRow } from '../components/MuscleRow';

const title = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** Every muscle group, trained ones first, untrained ones listed so gaps are obvious. */
export const MusclesScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<HomeStackParams>>();
  const { colors, spacing } = useTheme();
  const bottomInset = useTabScrollInset();
  const ins = useInsights();
  const trained = ins.muscles30d;
  const max = Math.max(1, ...trained.map(m => m.sets));
  const untrained = MUSCLE_GROUPS.filter(m => !trained.some(t => t.muscle === m));

  return (
    <SafeAreaView edges={['left', 'right']} style={{ flex: 1, backgroundColor: colors.ground }}>
      <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing.xl + bottomInset }}>
        <SurfaceCard>
          <View style={{ alignItems: 'center', marginBottom: spacing.sm }}>
            <MuscleMap primary={trained.slice(0, 6).map(m => m.muscle as MuscleGroup)} secondary={trained.slice(6).map(m => m.muscle as MuscleGroup)} height={190} />
          </View>
          <CustomText variant="caption" color={colors.inkMuted} centered>Sets in the last 30 days, by primary muscle.</CustomText>
        </SurfaceCard>
        <SurfaceCard style={{ paddingVertical: 0 }}>
          {trained.map((m, i) => (
            <View key={m.muscle} style={{ borderTopWidth: i ? 1 : 0, borderTopColor: colors.line }}>
              <MuscleRow muscle={m.muscle} sets={m.sets} max={max} onPress={() => navigation.navigate('MuscleDetailScreen', { muscle: m.muscle })} />
            </View>
          ))}
          {trained.length === 0 && <CustomText variant="body" color={colors.inkMuted} style={{ paddingVertical: spacing.lg }}>Nothing logged in the last 30 days.</CustomText>}
        </SurfaceCard>
        {untrained.length > 0 && (
          <View style={{ gap: spacing.sm }}>
            <CustomText variant="overline" color={colors.inkMuted}>Not trained in 30 days</CustomText>
            <CustomText variant="body" color={colors.inkMuted}>{untrained.map(title).join(', ')}</CustomText>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};
