import React, { useId } from 'react';
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';

/** The halo's width, in badges (build 20, canvas option A). */
const HALO = 1.6;

/**
 * A soft, still halo behind a badge in its material's own glow colour, so
 * the black around it isn't flat (build 20, owner's pick on the canvas).
 * Centred on a box `badgeSize` wide, which it overflows.
 */
export const BadgeHalo = ({ color, badgeSize }: { color: string; badgeSize: number }) => {
  const id = `halo${useId().replace(/[^A-Za-z0-9]/g, '')}`;
  const size = badgeSize * HALO;
  return (
    <Svg width={size} height={size} pointerEvents="none" style={{ position: 'absolute', left: (badgeSize - size) / 2, top: (badgeSize - size) / 2 }}>
      <Defs>
        <RadialGradient id={id} cx="50%" cy="50%" r="50%">
          <Stop offset="0" stopColor={color} stopOpacity={0.38} />
          <Stop offset="0.32" stopColor={color} stopOpacity={0.17} />
          <Stop offset="0.68" stopColor={color} stopOpacity={0} />
        </RadialGradient>
      </Defs>
      <Circle cx={size / 2} cy={size / 2} r={size / 2} fill={`url(#${id})`} />
    </Svg>
  );
};
