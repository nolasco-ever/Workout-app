import React, { useEffect } from 'react';
import { ScrollView, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from '../../components/layout/SafeAreaView';
import { NavigationProp, RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { FamilyProgress, compactCount, parseAchievementId, thresholdsFor, tierLabel } from '../../data/engine/achievements';
import { AchievementFamilyId } from '../../data/models';
import { useAchievements } from '../../data/hooks/useAchievements';
import { BadgeSvg } from '../../components/achievements/BadgeSvg';
import { artFor } from '../../components/achievements/badgeArt';
import { preloadBadges } from '../../components/achievements/preloadBadges';
import { CustomText } from '../../components/text/customText';
import { useTheme } from '../../theme';
import { AppStackParams } from '../../appNavigators/AppStack';

const COLUMNS = 5;
/**
 * A folding phone's closed outer display is this wide. The grid is sized to
 * the narrower of the window and this, so five tiles fill the closed screen
 * (and any phone), and opening the phone changes nothing: a grid that
 * followed the window redrew a beat after each fold, and one laid out in
 * percentages re-rasterised every badge drawing and blacked the screen out
 * for a second.
 */
const OUTER_DISPLAY_WIDTH = 466;

/** What each family counts, short enough to sit beside its name. */
const COUNTS: Record<AchievementFamilyId, string> = {
  workouts: 'workouts completed',
  streak: 'days in a row',
  volume: 'weight lifted',
  records: 'personal records',
  cycles: 'cycles finished',
  perfect_cycles: 'cycles with every workout done',
  early_bird: 'workouts before 6am',
  night_owl: 'workouts after 10pm',
  buddies: 'buddies',
  plan_uses: 'plans copied by buddies',
};

/** One family: its name, how far along it is, and every tier laid out in order, locked ones in pewter. */
const FamilySection = ({ progress, unit, cell, onOpen }: { progress: FamilyProgress; unit: 'lb' | 'kg'; cell: number; onOpen: (tier: number) => void }) => {
  const { colors, spacing } = useTheme();
  const { family, tier } = progress;
  const thresholds = thresholdsFor(family, unit);
  return (
    <View style={{ gap: spacing.sm }}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: spacing.sm }}>
        <View style={{ flex: 1 }}>
          <CustomText variant="heading">{family.name}</CustomText>
          <CustomText variant="caption" color={colors.inkMuted}>{COUNTS[family.id]}</CustomText>
        </View>
        <CustomText variant="caption" color={colors.inkMuted}>{tier} of {thresholds.length}</CustomText>
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', maxWidth: COLUMNS * cell }}>
        {thresholds.map((threshold, i) => {
          const t = i + 1;
          const earned = t <= tier;
          return (
            <TouchableOpacity key={t} onPress={() => onOpen(t)} activeOpacity={0.7} accessibilityRole="button" accessibilityLabel={`${family.name}, ${artFor(t).name}, ${tierLabel(family.id, threshold, unit)}, ${earned ? 'earned' : 'locked'}`} style={{ width: cell, alignItems: 'center', paddingVertical: spacing.xs }}>
              <BadgeSvg family={family.id} tier={t} locked={!earned} size={cell - spacing.sm} />
              <CustomText variant="caption" color={earned ? colors.ink : colors.inkMuted} centered numberOfLines={1} style={{ marginTop: 2 }}>{family.id === 'volume' ? compactCount(threshold) : threshold.toLocaleString()}</CustomText>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

/** The grid's shape while the unlocks load: ten families of grey tiles. */
const Skeleton = ({ cell }: { cell: number }) => {
  const { colors, spacing, radius } = useTheme();
  return (
    <>
      {[8, 7, 7, 6, 5, 4, 4, 4, 4, 5].map((count, f) => (
        <View key={f} style={{ gap: spacing.sm }}>
          <View style={{ width: 120, height: 18, borderRadius: radius.pill, backgroundColor: colors.surfaceRaised }} />
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', maxWidth: COLUMNS * cell }}>
            {Array.from({ length: count }, (_, i) => (
              <View key={i} style={{ width: cell, alignItems: 'center', paddingVertical: spacing.xs }}>
                <View style={{ width: cell - spacing.sm, height: cell - spacing.sm, borderRadius: radius.pill, backgroundColor: colors.surfaceRaised }} />
              </View>
            ))}
          </View>
        </View>
      ))}
    </>
  );
};

/** Every badge of every family, five to a row, grouped by family; tap one to see it in 3D. */
export const AchievementsScreen = () => {
  const { colors, spacing } = useTheme();
  const { width } = useWindowDimensions();
  const cell = Math.floor((Math.min(width, OUTER_DISPLAY_WIDTH) - spacing.lg * 2) / COLUMNS);
  const navigation = useNavigation<NavigationProp<AppStackParams>>();
  const { params } = useRoute<RouteProp<AppStackParams, 'AchievementsScreen'>>();
  // Tiers come from the stored unlocks, live; measuring the whole history is not needed to draw the grid.
  const state = useAchievements(false);

  // Opened from a feed item or a push: go straight to that badge.
  const focus = params?.achievementId ?? null;
  useEffect(() => {
    const target = focus ? parseAchievementId(focus) : null;
    if (target) navigation.navigate('BadgeScreen', { family: target.family, tier: target.tier });
  }, [focus, navigation]);

  useEffect(() => {
    preloadBadges(state.unlocks.map(u => ({ family: u.family, tier: u.tier })));
  }, [state.unlocks]);
  return (
    <SafeAreaView edges={['bottom', 'left', 'right']} style={{ flex: 1, backgroundColor: colors.ground }}>
      <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.xl, paddingBottom: spacing.xxl }}>
        {state.loading ? (
          <Skeleton cell={cell} />
        ) : (
          state.progress.map(p => (
            <FamilySection key={p.family.id} progress={p} unit={state.unit} cell={cell} onOpen={tier => navigation.navigate('BadgeScreen', { family: p.family.id, tier })} />
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
};
