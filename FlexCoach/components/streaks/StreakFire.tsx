import React, { useId } from 'react';
import { View } from 'react-native';
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';
import { Icon } from '../icons/Icon';
import { generalIcons } from '../icons/icon-library';
import { streakFireStage } from '../../data/engine/streaks';
import { useTheme } from '../../theme';

/** Per stage (1 to 5): the icon's share of `size`, its weight, and the glow's width and strength. */
const STAGES = [
  { scale: 0.8, weight: 'regular', glow: 0, glowOpacity: 0 },
  { scale: 0.88, weight: 'fill', glow: 0, glowOpacity: 0 },
  { scale: 0.94, weight: 'fill', glow: 1.4, glowOpacity: 0.28 },
  { scale: 1, weight: 'fill', glow: 1.9, glowOpacity: 0.42 },
  { scale: 1, weight: 'fill', glow: 1.9, glowOpacity: 0.5 },
] as const;

/**
 * The fire beside a streak (build 20, designed on the canvas): the app's fire
 * icon, outline at 2 days, filled from 10, a glow from 25 that grows at 50,
 * and a ring at 100. Nothing below 2 days. Takes `size` in layout; the glow and
 * ring spill past it without moving anything. Decorative: the day count beside
 * it carries the meaning.
 */
export const StreakFire = ({ days, size }: { days: number; size: number }) => {
  const { colors } = useTheme();
  // One gradient id per fire, so several on a screen (the Buddies list) never share one.
  const gradientId = `streakGlow${useId().replace(/[^A-Za-z0-9]/g, '')}`;
  const stage = streakFireStage(days);
  if (stage === 0) return null;
  const look = STAGES[stage - 1];
  const glow = look.glow * size;
  const ring = size * 1.5;
  return (
    <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" pointerEvents="none" style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center', overflow: 'visible' }}>
      {glow > 0 && (
        <Svg width={glow} height={glow} style={{ position: 'absolute', left: (size - glow) / 2, top: (size - glow) / 2 }}>
          <Defs>
            <RadialGradient id={gradientId} cx="50%" cy="50%" r="50%">
              <Stop offset="0" stopColor={colors.accent} stopOpacity={look.glowOpacity} />
              <Stop offset="0.68" stopColor={colors.accent} stopOpacity={0} />
            </RadialGradient>
          </Defs>
          <Circle cx={glow / 2} cy={glow / 2} r={glow / 2} fill={`url(#${gradientId})`} />
        </Svg>
      )}
      {stage === 5 && (
        <View style={{ position: 'absolute', left: (size - ring) / 2, top: (size - ring) / 2, width: ring, height: ring, borderRadius: ring / 2, borderWidth: Math.max(1.5, size / 16), borderColor: colors.accent }} />
      )}
      <Icon icon={generalIcons.flame} size={Math.round(size * look.scale)} color={colors.accent} weight={look.weight} />
    </View>
  );
};
