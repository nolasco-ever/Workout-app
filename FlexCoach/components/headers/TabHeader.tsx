import React from 'react';
import { TouchableOpacity, View } from 'react-native';
import { CustomText } from '../text/customText';
import { Icon, IconSource } from '../icons/Icon';
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
 */
export const TabHeader = ({ title, action }: { title: string; action?: TabHeaderAction }) => {
  const { colors, spacing, radius } = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md, paddingTop: spacing.xs }}>
      <CustomText variant="display" style={{ flex: 1 }} numberOfLines={1} accessibilityRole="header">
        {title}
      </CustomText>
      {action && (
        <TouchableOpacity
          onPress={action.onPress}
          hitSlop={6}
          accessibilityRole="button"
          accessibilityLabel={action.badge ? `${action.accessibilityLabel}, unread` : action.accessibilityLabel}
          style={{ width: 40, height: 40, borderRadius: radius.pill, backgroundColor: colors.surfaceRaised, alignItems: 'center', justifyContent: 'center' }}
        >
          <View>
            <Icon icon={action.icon} color={colors.ink} size={22} />
            {action.badge && <View style={{ position: 'absolute', top: -1, right: -1, width: 10, height: 10, borderRadius: 5, backgroundColor: colors.accent, borderWidth: 2, borderColor: colors.surfaceRaised }} />}
          </View>
        </TouchableOpacity>
      )}
    </View>
  );
};
