import React from 'react';
import Svg, { Rect } from 'react-native-svg';

interface Props {
  /** Rendered width and height in points. */
  size?: number;
}

/**
 * The app icon mark: three plates racked biggest to smallest, cream on the
 * accent. Mirrors store/icon.svg so the Welcome screen matches the home
 * screen icon exactly.
 */
// Fixed colours: the mark must match the installed icon in both themes.
const EMBER = '#E2602A';
const CREAM = '#FBE7DD';

export const BrandMark = ({ size = 72 }: Props) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 1024 1024">
      <Rect width={1024} height={1024} rx={224} fill={EMBER} />
      <Rect x={217} y={164} width={200} height={696} rx={64} fill={CREAM} />
      <Rect x={449} y={236} width={176} height={552} rx={56} fill={CREAM} />
      <Rect x={657} y={312} width={150} height={400} rx={48} fill={CREAM} />
    </Svg>
  );
};
