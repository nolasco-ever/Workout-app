import React from 'react';
import { View } from 'react-native';
import { LiquidGlassView, isLiquidGlassSupported } from '@callstack/liquid-glass';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TabHeader, TabHeaderAction } from './TabHeader';
import { GLASS_BUTTON_SIZE } from '../buttons/GlassIconButton';
import { useTheme } from '../../theme';

/**
 * A tab root's title row, fixed over the top of its scroll view on a glass
 * bar, so the title and its button stay in reach as the content scrolls
 * under it. On iOS 26 the bar is Liquid Glass; elsewhere a translucent
 * ground. The screen pads its scroll content by `onHeight` (see
 * `estimateStickyHeaderHeight` for the first frame) and places this after
 * the scroll view so it draws on top.
 */
export const StickyTabHeader = ({ title, action, leading, onHeight }: { title: string; action?: TabHeaderAction; leading?: TabHeaderAction; onHeight: (height: number) => void }) => {
  const { colors, spacing } = useTheme();
  const insets = useSafeAreaInsets();
  // Padded like the content it sits over, so the row lands where it did inside the scroll view. The sides too: the bar
  // is placed over the screen's padding, so beside a folding phone's status column it would otherwise run under it.
  const padding = { paddingTop: insets.top + spacing.lg, paddingLeft: insets.left + spacing.lg, paddingRight: insets.right + spacing.lg, paddingBottom: spacing.sm };
  const bar = isLiquidGlassSupported ? (
    <LiquidGlassView effect="regular" style={padding}>
      <TabHeader title={title} action={action} leading={leading} />
    </LiquidGlassView>
  ) : (
    <View style={[padding, { backgroundColor: `${colors.ground}F0` }]}>
      <TabHeader title={title} action={action} leading={leading} />
    </View>
  );
  return (
    <View style={{ position: 'absolute', top: 0, left: 0, right: 0 }} onLayout={e => onHeight(e.nativeEvent.layout.height)}>
      {bar}
    </View>
  );
};

/** The bar's height before it has been measured: the top inset, the row and its padding. */
export const estimateStickyHeaderHeight = (topInset: number, spacing: { lg: number; sm: number; xs: number }): number => topInset + spacing.lg + spacing.xs + GLASS_BUTTON_SIZE + spacing.sm;
