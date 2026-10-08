import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RouteProp, useRoute } from '@react-navigation/native';
import { AchievementFamilyId, AchievementUnlock } from '../../data/models';
import { FamilyProgress, achievementIdOf, parseAchievementId, thresholdsFor, tierLabel } from '../../data/engine/achievements';
import { WeightUnit } from '../../data/models';

/** A family's progress with the unit its labels are written in. */
type Progress = FamilyProgress & { unit: WeightUnit };
import { useAchievements } from '../../data/hooks/useAchievements';
import { dateLabel } from '../../components/charts/scale';
import { toLocalDate } from '../../data/engine/dates';
import { Badge, artFor } from '../../components/achievements/Badge';
import { BottomSheet } from '../../components/overlays/BottomSheet';
import { CustomText } from '../../components/text/customText';
import { SurfaceCard } from '../../components/cards/SurfaceCard';
import { Icon } from '../../components/icons/Icon';
import { generalIcons } from '../../components/icons/icon-library';
import { useTheme } from '../../theme';
import { AppStackParams } from '../../appNavigators/AppStack';

const fmt = (n: number): string => Math.round(n).toLocaleString();

/** "12 to go", or "Maxed out" at the top of the ladder. */
const toGo = (p: Progress): string => (p.next === null ? 'Maxed out' : `${fmt(p.next - p.value)} to go`);

const Tile = ({ progress, onPress }: { progress: Progress; onPress: () => void }) => {
  const { colors, spacing, radius } = useTheme();
  const { family, tier } = progress;
  const unlocked = tier > 0;
  const thresholds = thresholdsFor(family, progress.unit);
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7} accessibilityRole="button" accessibilityLabel={`${family.name}, ${unlocked ? tierLabel(family.id, thresholds[tier - 1], progress.unit) : 'locked'}`} style={{ flexBasis: '47%', flexGrow: 1 }}>
      <SurfaceCard style={{ alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.lg }}>
        <Badge family={family.id} tier={tier} size={80} />
        <View style={{ alignItems: 'center', gap: 2 }}>
          <CustomText variant="bodyStrong" centered>{family.name}</CustomText>
          <CustomText variant="caption" color={unlocked ? colors.ink : colors.inkMuted} centered numberOfLines={1}>
            {unlocked ? `${artFor(tier).name} · ${tierLabel(family.id, thresholds[tier - 1], progress.unit)}` : 'Locked'}
          </CustomText>
        </View>
        <View style={{ alignSelf: 'stretch', gap: spacing.xs }}>
          <View style={{ height: 5, borderRadius: 3, backgroundColor: colors.surfaceRaised, overflow: 'hidden' }}>
            <View style={{ height: 5, width: `${Math.round(progress.fraction * 100)}%`, borderRadius: 3, backgroundColor: unlocked ? artFor(tier).mid : colors.accent }} />
          </View>
          <CustomText variant="caption" color={colors.inkMuted} centered>{toGo(progress)}</CustomText>
        </View>
      </SurfaceCard>
    </TouchableOpacity>
  );
};

/** Every tier of one family, with when it was earned or how far off it is. */
const FamilySheet = ({ progress, unlocks, onClose }: { progress: Progress | null; unlocks: AchievementUnlock[]; onClose: () => void }) => {
  const { colors, spacing } = useTheme();
  const p = progress;
  const thresholds = p ? thresholdsFor(p.family, p.unit) : [];
  const byId = new Map(unlocks.map(u => [u.achievementId, u]));
  return (
    <BottomSheet open={!!p} title={p?.family.name ?? ''} onClose={onClose}>
      {p && (
        <>
          <View style={{ alignItems: 'center', gap: spacing.sm }}>
            <Badge family={p.family.id} tier={p.tier} size={132} />
            <CustomText variant="heading" centered>{p.tier > 0 ? `${artFor(p.tier).name} · ${tierLabel(p.family.id, thresholds[p.tier - 1], p.unit)}` : 'Not earned yet'}</CustomText>
            <CustomText variant="body" color={colors.inkMuted} centered>
              {fmt(p.value)} {p.family.counts}.
            </CustomText>
          </View>
          <SurfaceCard style={{ padding: 0 }}>
            {thresholds.map((threshold, i) => {
              const tier = i + 1;
              const unlock = byId.get(achievementIdOf(p.family.id, tier));
              const earned = !!unlock || tier <= p.tier;
              return (
                <View key={tier} style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, borderTopWidth: i ? 1 : 0, borderTopColor: colors.line, opacity: earned ? 1 : 0.6 }}>
                  <Badge family={p.family.id} tier={earned ? tier : 0} size={36} />
                  <View style={{ flex: 1 }}>
                    <CustomText variant="bodyStrong">{tierLabel(p.family.id, threshold, p.unit)}</CustomText>
                    <CustomText variant="caption" color={colors.inkMuted}>{artFor(tier).name}</CustomText>
                  </View>
                  {earned ? (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
                      <Icon icon={generalIcons.check} size={16} color={colors.success} strokeWidth={3} />
                      <CustomText variant="caption" color={colors.inkMuted}>{unlock ? dateLabel(toLocalDate(new Date(unlock.unlockedAt))) : 'Earned'}</CustomText>
                    </View>
                  ) : (
                    <CustomText variant="caption" color={colors.inkMuted}>{fmt(threshold - p.value)} to go</CustomText>
                  )}
                </View>
              );
            })}
          </SurfaceCard>
          <View style={{ height: spacing.xs }} />
        </>
      )}
    </BottomSheet>
  );
};

/** The badge grid: every family, its current material, and how far to the next tier. */
export const AchievementsScreen = () => {
  const { colors, spacing } = useTheme();
  const { params } = useRoute<RouteProp<AppStackParams, 'AchievementsScreen'>>();
  const state = useAchievements();
  const [open, setOpen] = useState<AchievementFamilyId | null>(null);

  // Opened from a feed item or a push: land on that badge.
  const focus = params?.achievementId ?? null;
  useEffect(() => {
    if (focus) setOpen(parseAchievementId(focus)?.family ?? null);
  }, [focus]);

  const tiers = state.unlocks.length;
  const progress: Progress[] = state.progress.map(p => ({ ...p, unit: state.unit }));
  const selected = progress.find(p => p.family.id === open) ?? null;

  return (
    <SafeAreaView edges={['bottom', 'left', 'right']} style={{ flex: 1, backgroundColor: colors.ground }}>
      <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing.xxl }}>
        <View style={{ gap: spacing.xs }}>
          <CustomText variant="title">{state.earned} of {progress.length} badges</CustomText>
          <CustomText variant="body" color={colors.inkMuted}>
            {tiers === 0 ? 'Finish a workout to earn your first one. Every badge upgrades as you keep going.' : `${tiers} tier${tiers === 1 ? '' : 's'} earned. Every badge upgrades as you keep going.`}
          </CustomText>
        </View>
        {state.loading ? (
          <ActivityIndicator color={colors.accent} style={{ marginTop: spacing.xxl }} />
        ) : (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md }}>
            {progress.map(p => (
              <Tile key={p.family.id} progress={p} onPress={() => setOpen(p.family.id)} />
            ))}
          </View>
        )}
      </ScrollView>
      <FamilySheet progress={selected} unlocks={state.unlocks} onClose={() => setOpen(null)} />
    </SafeAreaView>
  );
};
