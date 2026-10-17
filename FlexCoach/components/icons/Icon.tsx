import React from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import type { Icon as PhosphorIcon, IconWeight } from 'phosphor-react-native';
import { useTheme } from '../../theme';

/** An icon component from the Phosphor set. Pass the component, not a name. */
export type IconSource = PhosphorIcon;

export interface IconProps {
  icon: IconSource;
  color?: string;
  size?: number;
  /**
   * The line weight, in the stroke terms the app has always used: 2 is the
   * regular mark, 2.5 and up the bold one. (Phosphor draws weights as whole
   * glyphs, so this picks a weight rather than a stroke.)
   */
  strokeWidth?: number;
  weight?: IconWeight;
  style?: StyleProp<ViewStyle>;
}

/** Phosphor's regular weight for the usual 2-point stroke, bold for anything heavier. */
export const weightFor = (strokeWidth: number): IconWeight => (strokeWidth >= 2.5 ? 'bold' : 'regular');

/**
 * Single icon primitive for the app. Wraps Phosphor so call sites never
 * depend on the icon library directly and defaults match the design tokens.
 */
export const Icon = ({ icon: Glyph, color, size, strokeWidth = 2, weight, style }: IconProps) => {
  const theme = useTheme();
  return <Glyph color={color ?? theme.colors.ink} size={size ?? theme.iconSize.md} weight={weight ?? weightFor(strokeWidth)} style={style} />;
};

/** The same glyph always drawn in one weight (a filled bookmark, a filled thumb), whatever the call site asks. */
export const withWeight = (Glyph: PhosphorIcon, weight: IconWeight): PhosphorIcon => {
  const Fixed: PhosphorIcon = props => <Glyph {...props} weight={weight} />;
  Fixed.displayName = `${Glyph.displayName ?? 'Icon'}:${weight}`;
  return Fixed;
};
