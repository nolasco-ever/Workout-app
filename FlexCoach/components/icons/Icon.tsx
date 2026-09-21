import React from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import type { LucideIcon } from 'lucide-react-native';
import { useTheme } from '../../theme';

/** An icon component from the Lucide set. Pass the component, not a name. */
export type IconSource = LucideIcon;

export interface IconProps {
  icon: IconSource;
  color?: string;
  size?: number;
  strokeWidth?: number;
  style?: StyleProp<ViewStyle>;
}

/**
 * Single icon primitive for the app. Wraps Lucide so call sites never depend
 * on the icon library directly and defaults match the design tokens.
 */
export const Icon = ({ icon: Glyph, color, size, strokeWidth = 2, style }: IconProps) => {
  const theme = useTheme();
  return <Glyph color={color ?? theme.colors.ink} size={size ?? theme.iconSize.md} strokeWidth={strokeWidth} style={style} />;
};
