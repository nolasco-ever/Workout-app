import React from 'react';
import { Switch, View } from 'react-native';
import { CustomText } from '../text/customText';
import { Icon, IconSource } from '../icons/Icon';
import { useTheme } from '../../theme';

interface Props {
  title: string;
  description?: string;
  icon?: IconSource;
  value: boolean;
  onChange: (value: boolean) => void;
  disabled?: boolean;
  /** Draw a divider above. */
  divider?: boolean;
}

/** A settings row with a toggle at the right edge. Use inside a SurfaceCard with padding 0. */
export const SwitchRow = ({ title, description, icon, value, onChange, disabled = false, divider = false }: Props) => {
  const { colors, spacing, radius } = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.md, paddingHorizontal: spacing.lg, borderTopWidth: divider ? 1 : 0, borderTopColor: colors.line, opacity: disabled ? 0.5 : 1 }}>
      {icon && (
        <View style={{ width: 36, height: 36, borderRadius: radius.sm, backgroundColor: colors.surfaceRaised, alignItems: 'center', justifyContent: 'center' }}>
          <Icon icon={icon} size={18} color={colors.ink} />
        </View>
      )}
      <View style={{ flex: 1 }}>
        <CustomText variant="bodyStrong">{title}</CustomText>
        {description ? <CustomText variant="caption" color={colors.inkMuted}>{description}</CustomText> : null}
      </View>
      <Switch value={value} onValueChange={onChange} disabled={disabled} trackColor={{ true: colors.accent, false: colors.line }} thumbColor={colors.surface} ios_backgroundColor={colors.line} accessibilityLabel={title} />
    </View>
  );
};
