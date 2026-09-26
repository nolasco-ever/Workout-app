import React from 'react';
import Svg, { Circle, ClipPath, Defs, Ellipse, G, Line, Path, Rect } from 'react-native-svg';

/**
 * Little flat cartoon faces for the avatar picker. Each character is a
 * handful of choices (skin, hair style and colour, shirt, extras) drawn
 * on a 100×100 disc, so new ones are a line of config, not new artwork.
 */

export type HairStyle = 'short' | 'buzz' | 'curly' | 'long' | 'bun' | 'puffs' | 'bald' | 'cap';

export interface FaceSpec {
  bg: string;
  skin: string;
  hair: HairStyle;
  hairColor: string;
  shirt: string;
  glasses?: boolean;
  beard?: boolean;
  headband?: string;
  cheeks?: boolean;
  /** Cap colour when hair is 'cap'. */
  cap?: string;
}

const INK = '#1A1A1C';
const MOUTH = '#8B3A2F';

const Hair = ({ style, color }: { style: HairStyle; color: string }) => {
  switch (style) {
    case 'short':
      return <Path d="M29 42 Q29 19 50 19 Q71 19 71 42 Q66 30 50 30 Q34 30 29 42 Z" fill={color} />;
    case 'buzz':
      return <Path d="M30 40 Q30 23 50 22 Q70 23 70 40 Q64 32 50 31 Q36 32 30 40 Z" fill={color} />;
    case 'curly':
      return (
        <G fill={color}>
          <Circle cx={36} cy={27} r={8} />
          <Circle cx={50} cy={22} r={9} />
          <Circle cx={64} cy={27} r={8} />
          <Circle cx={30} cy={37} r={6} />
          <Circle cx={70} cy={37} r={6} />
          <Path d="M30 40 Q30 26 50 26 Q70 26 70 40 Q64 33 50 33 Q36 33 30 40 Z" />
        </G>
      );
    case 'long':
      return <Path d="M27 48 Q26 17 50 17 Q74 17 73 48 L75 74 Q66 68 62 50 Q60 33 50 32 Q40 33 38 50 Q34 68 25 74 Z" fill={color} />;
    case 'bun':
      return (
        <G fill={color}>
          <Circle cx={50} cy={17} r={7} />
          <Path d="M29 42 Q29 19 50 19 Q71 19 71 42 Q66 30 50 30 Q34 30 29 42 Z" />
        </G>
      );
    case 'puffs':
      return (
        <G fill={color}>
          <Circle cx={27} cy={31} r={9} />
          <Circle cx={73} cy={31} r={9} />
          <Path d="M29 42 Q29 19 50 19 Q71 19 71 42 Q66 30 50 30 Q34 30 29 42 Z" />
        </G>
      );
    case 'cap':
      return null;
    case 'bald':
    default:
      return null;
  }
};

const Cap = ({ color }: { color: string }) => (
  <G>
    <Path d="M28 41 Q28 19 50 19 Q72 19 72 41 Z" fill={color} />
    <Rect x={24} y={39} width={52} height={5} rx={2.5} fill={color} opacity={0.75} />
  </G>
);

export const FaceAvatar = ({ spec, size }: { spec: FaceSpec; size: number }) => {
  const id = React.useId().replace(/[^a-zA-Z0-9]/g, '');
  const clip = `face-${id}`;
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Defs>
        <ClipPath id={clip}>
          <Circle cx={50} cy={50} r={50} />
        </ClipPath>
      </Defs>
      <G clipPath={`url(#${clip})`}>
        <Circle cx={50} cy={50} r={50} fill={spec.bg} />
        {/* Shoulders and neck */}
        <Path d="M16 104 V86 Q16 72 32 71 L68 71 Q84 72 84 86 V104 Z" fill={spec.shirt} />
        <Rect x={44} y={58} width={12} height={15} fill={spec.skin} opacity={0.85} />
        {/* Long hair sits behind the head */}
        {spec.hair === 'long' && <Hair style="long" color={spec.hairColor} />}
        {/* Head */}
        <Circle cx={29} cy={47} r={4} fill={spec.skin} />
        <Circle cx={71} cy={47} r={4} fill={spec.skin} />
        <Ellipse cx={50} cy={45} rx={21} ry={23} fill={spec.skin} />
        {spec.hair !== 'long' && <Hair style={spec.hair} color={spec.hairColor} />}
        {spec.hair === 'cap' && <Cap color={spec.cap ?? INK} />}
        {spec.headband && <Rect x={29} y={33} width={42} height={6} rx={3} fill={spec.headband} />}
        {spec.beard && <Path d="M31 51 Q33 70 50 70 Q67 70 69 51 Q60 59 50 59 Q40 59 31 51 Z" fill={spec.hairColor} />}
        {/* Face */}
        <Path d="M37 41 Q42 38 46 41" stroke={spec.hairColor} strokeWidth={2} strokeLinecap="round" fill="none" />
        <Path d="M54 41 Q58 38 63 41" stroke={spec.hairColor} strokeWidth={2} strokeLinecap="round" fill="none" />
        <Circle cx={42} cy={47} r={2.4} fill={INK} />
        <Circle cx={58} cy={47} r={2.4} fill={INK} />
        {spec.glasses && (
          <G stroke={INK} strokeWidth={2} fill="none">
            <Circle cx={42} cy={47} r={6.5} />
            <Circle cx={58} cy={47} r={6.5} />
            <Line x1={48.5} y1={47} x2={51.5} y2={47} />
          </G>
        )}
        {spec.cheeks && (
          <G fill="#F28B82" opacity={0.45}>
            <Circle cx={36} cy={53} r={3} />
            <Circle cx={64} cy={53} r={3} />
          </G>
        )}
        <Path d="M43 56 Q50 62 57 56" stroke={MOUTH} strokeWidth={2} strokeLinecap="round" fill="none" />
      </G>
    </Svg>
  );
};
