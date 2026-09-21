import React from 'react';
import { TouchableOpacity, View } from 'react-native';
import { CustomText } from '../text/customText';
import { Icon, IconSource } from '../icons/Icon';
import { directionIcons } from '../icons/icon-library';
import { useTheme } from '../../theme';

interface Props {
  title: string;
  description?: string;
  icon?: IconSource;
  iconColor?: string;
  /** Text shown at the right edge, e.g. a value or a time. */
  right?: string;
  /** Show a chevron. Defaults to true when onPress is set. */
  chevron?: boolean;
  /** Draw a divider above. */
  divider?: boolean;
  onPress?: () => void;
  tone?: 'default' | 'destructive';
}

/** Token-styled list row for settings, menus, and simple lists. Use inside a SurfaceCard with padding 0. */
export const Row = ({ title, description, icon, iconColor, right, chevron, divider = false, onPress, tone = 'default' }: Props) => {
  const { colors, spacing, radius } = useTheme();
  const showChevron = chevron ?? !!onPress;
  const titleColor = tone === 'destructive' ? colors.error : colors.ink;
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={0.6}
      style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.md, paddingHorizontal: spacing.lg, borderTopWidth: divider ? 1 : 0, borderTopColor: colors.line }}
    >
      {icon && (
        <View style={{ width: 36, height: 36, borderRadius: radius.sm, backgroundColor: colors.surfaceRaised, alignItems: 'center', justifyContent: 'center' }}>
          <Icon icon={icon} size={18} color={iconColor ?? titleColor} />
        </View>
      )}
      <View style={{ flex: 1 }}>
        <CustomText variant="bodyStrong" color={titleColor}>{title}</CustomText>
        {description ? <CustomText variant="caption" color={colors.inkMuted}>{description}</CustomText> : null}
      </View>
      {right ? <CustomText variant="caption" color={colors.inkMuted}>{right}</CustomText> : null}
      {showChevron && <Icon icon={directionIcons.angleRight} size={18} color={colors.inactive} />}
    </TouchableOpacity>
  );
};
