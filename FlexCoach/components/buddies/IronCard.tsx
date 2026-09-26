import React from 'react';
import { View } from 'react-native';
import { PublicProfile, WeightUnit } from '../../data/models';
import { formatWeight, kgToLb } from '../../data/engine/units';
import { dateLabel } from '../charts/scale';
import { toLocalDate } from '../../data/engine/dates';
import { CustomText } from '../text/customText';
import { Icon } from '../icons/Icon';
import { generalIcons } from '../icons/icon-library';
import { useTheme } from '../../theme';
import { Avatar } from './Avatar';

/** Big numbers read better rounded: 43,210 → "43k". */
const compact = (n: number): string => (n >= 100_000 ? `${Math.round(n / 1000)}k` : n >= 10_000 ? `${(n / 1000).toFixed(1)}k` : Math.round(n).toLocaleString());

const Stat = ({ label, value, sub }: { label: string; value: string; sub?: string | null }) => {
  const { colors, spacing, radius } = useTheme();
  return (
    <View style={{ flexBasis: '47%', flexGrow: 1, backgroundColor: colors.surfaceRaised, borderRadius: radius.md, padding: spacing.md, gap: 2 }}>
      <CustomText variant="overline" color={colors.inkMuted}>{label}</CustomText>
      <CustomText variant="title" numberOfLines={1} style={{ fontVariant: ['tabular-nums'] }}>{value}</CustomText>
      {sub ? <CustomText variant="caption" color={colors.inkMuted} numberOfLines={1}>{sub}</CustomText> : null}
    </View>
  );
};

/**
 * The Iron Card: a person's training summary the way buddies see it. Used
 * for your own card, a scanned card, and a buddy's page. Shows numbers,
 * never sets or body weight.
 */
export const IronCard = ({ card, unit, footer }: { card: PublicProfile; unit: WeightUnit; footer?: React.ReactNode }) => {
  const { colors, spacing, radius } = useTheme();
  const since = card.trainingSince ? dateLabel(toLocalDate(new Date(card.trainingSince))) : null;
  const best = card.bestRecord ?? null;
  const bestValue = best ? (best.kind === 'weight' ? formatWeight(best.value, unit) : best.kind === 'reps' ? `${best.value} reps` : best.kind === 'duration' ? `${Math.round(best.value)}s` : `${Math.round(best.value)} m`) : '—';
  const volume = card.totalVolumeKg ?? 0;
  const volumeText = volume > 0 ? `${compact(unit === 'lb' ? kgToLb(volume) : volume)} ${unit}` : '—';
  return (
    <View style={{ backgroundColor: colors.surface, borderRadius: radius.xl, borderWidth: 1, borderColor: colors.line, padding: spacing.lg, gap: spacing.lg, overflow: 'hidden' }}>
      {/* Accent band so the card reads as a card, not a settings group. */}
      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 6, backgroundColor: colors.accent }} />
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingTop: spacing.xs }}>
        <Avatar uri={card.photoUrl} name={card.displayName} size={64} />
        <View style={{ flex: 1 }}>
          <CustomText variant="overline" color={colors.accent}>Iron Card</CustomText>
          <CustomText variant="title" numberOfLines={1}>{card.displayName ?? 'FlexCoach lifter'}</CustomText>
          <CustomText variant="caption" color={colors.inkMuted}>{since ? `Training since ${since}` : 'Just getting started'}</CustomText>
        </View>
        {card.currentStreakDays > 0 && (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: colors.accentTint, borderRadius: radius.pill, paddingHorizontal: spacing.sm, paddingVertical: 4 }}>
            <Icon icon={generalIcons.flame} size={14} color={colors.accent} />
            <CustomText variant="label" color={colors.accent}>{card.currentStreakDays}d</CustomText>
          </View>
        )}
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
        <Stat label="Workouts" value={String(card.totalSessions)} sub={card.lastWorkoutDate ? `Last ${dateLabel(card.lastWorkoutDate)}` : 'None yet'} />
        <Stat label="Best lift" value={bestValue} sub={best?.exerciseName ?? 'No records yet'} />
        <Stat label="Longest streak" value={`${card.longestStreakDays} day${card.longestStreakDays === 1 ? '' : 's'}`} sub={card.currentStreakDays > 0 ? `${card.currentStreakDays} right now` : null} />
        <Stat label="Weight moved" value={volumeText} sub={card.favoriteExercise ? `Loves ${card.favoriteExercise}` : null} />
      </View>
      {card.lastCycleCompletionRate !== null && (
        <CustomText variant="caption" color={colors.inkMuted}>Last cycle: {Math.round(card.lastCycleCompletionRate * 100)}% of workouts done</CustomText>
      )}
      {footer}
    </View>
  );
};
