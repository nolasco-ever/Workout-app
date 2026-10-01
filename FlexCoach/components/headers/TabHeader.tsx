import React from 'react';
import { View } from 'react-native';
import { CustomText } from '../text/customText';
import { IconSource } from '../icons/Icon';
import { GLASS_BUTTON_SIZE, GlassIconButton } from '../buttons/GlassIconButton';
import { useTheme } from '../../theme';

export type TabHeaderAction = {
  icon: IconSource;
  accessibilityLabel: string;
  onPress: () => void;
  /** Draws an unread dot on the icon. */
  badge?: boolean;
};

/**
 * The title row at the top of a tab root, rendered inside the screen's own
 * scroll view instead of the native large-title header. The native header
 * stacked a bar for the action button above the title, which read as dead
 * space; here the title and the action share one line.
 *
 * `leading` sits before the title (Profile's Iron Card button); `action` after it (Home's bell).
 */
export const TabHeader = ({ title, action, leading }: { title: string; action?: TabHeaderAction; leading?: TabHeaderAction }) => {
  const { spacing } = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md, paddingTop: spacing.xs }}>
      {leading && <GlassIconButton {...leading} />}
      {/* The title's line box is the button's height, so the two centre on the same line. */}
      <CustomText variant="display" style={{ flex: 1, lineHeight: GLASS_BUTTON_SIZE, includeFontPadding: false }} numberOfLines={1} accessibilityRole="header">
        {title}
      </CustomText>
      {action && <GlassIconButton {...action} />}
    </View>
  );
};
