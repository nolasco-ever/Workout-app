import React from 'react';
import { View } from 'react-native';
import Svg, { Defs, Ellipse, LinearGradient, Path, Stop } from 'react-native-svg';
import { AchievementFamilyId } from '../../data/models';
import { materialFor } from '../../data/engine/achievements';
import { Icon } from '../icons/Icon';
import { FAMILY_MARKS, LOCKED_ART, MATERIAL_ART, Material } from './badgeArt';

/** The shield, in a 100 × 100 box. */
export const SHIELD = 'M50 3 L90 16 V50 C90 73 72 90 50 97 C28 90 10 73 10 50 V16 Z';
/** The same shield inset for the bevel. */
const INNER = 'M50 12 L82 22.5 V50 C82 68 68 82 50 88 C32 82 18 68 18 50 V22.5 Z';

export const artFor = (tier: number): Material => (tier > 0 ? MATERIAL_ART[materialFor(tier)] : LOCKED_ART);

interface Props {
  family: AchievementFamilyId;
  /** 0 draws the locked look. */
  tier: number;
  size?: number;
  /** Draw only the shape, for the celebration which lays its own mark and shimmer on top. */
  markless?: boolean;
}

/**
 * One badge: the family's mark on a shield in the tier's material. The
 * mark is constant across tiers; the material is the upgrade.
 */
export const Badge = ({ family, tier, size = 64, markless = false }: Props) => {
  const art = artFor(tier);
  const gid = `badge-${family}-${tier}`;
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} viewBox="0 0 100 100">
        <Defs>
          <LinearGradient id={`${gid}-face`} x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={art.light} />
            <Stop offset="0.5" stopColor={art.mid} />
            <Stop offset="1" stopColor={art.dark} />
          </LinearGradient>
          <LinearGradient id={`${gid}-rim`} x1="0" y1="1" x2="1" y2="0">
            <Stop offset="0" stopColor={art.light} />
            <Stop offset="0.5" stopColor={art.dark} />
            <Stop offset="1" stopColor={art.light} />
          </LinearGradient>
        </Defs>
        <Path d={SHIELD} fill={`url(#${gid}-rim)`} />
        <Path d={SHIELD} fill="none" stroke={art.rim} strokeWidth={2} />
        <Path d={INNER} fill={`url(#${gid}-face)`} stroke={art.rim} strokeWidth={1.5} strokeOpacity={0.6} />
        {/* Gloss across the top of the face. */}
        <Ellipse cx="44" cy="30" rx="26" ry="12" fill="#FFFFFF" opacity={tier > 0 ? 0.28 : 0.12} />
      </Svg>
      {!markless && (
        <View style={{ position: 'absolute' }}>
          <Icon icon={FAMILY_MARKS[family]} size={size * 0.4} color={art.ink} strokeWidth={2.25} />
        </View>
      )}
    </View>
  );
};
