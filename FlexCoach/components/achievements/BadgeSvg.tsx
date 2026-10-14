import React from 'react';
import { StyleProp, View, ViewStyle } from 'react-native';
import { SvgXml } from 'react-native-svg';
import { AchievementFamilyId } from '../../data/models';
import { badgeSvg } from './badgeSvgs';

interface Props {
  family: AchievementFamilyId;
  tier: number;
  /** Not yet earned: the same tier's drawing in quiet pewter. */
  locked?: boolean;
  size?: number;
  style?: StyleProp<ViewStyle>;
}

/**
 * The Badge Builder's own drawing of a badge, for grids and cards. The 3D
 * models are generated from these same drawings, so the two always agree.
 */
export const BadgeSvg = ({ family, tier, locked = false, size = 64, style }: Props) => {
  const xml = badgeSvg(family, tier, locked);
  if (!xml) return null;
  return (
    <View style={[{ width: size, height: size }, style]} accessibilityIgnoresInvertColors>
      <SvgXml xml={xml} width={size} height={size} />
    </View>
  );
};
