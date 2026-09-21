import React from 'react';
import { ActivityIndicator, TouchableOpacity, View } from 'react-native';
import { CustomText } from '../../../../components/text/customText';
import { Icon, IconSource } from '../../../../components/icons/Icon';
import { useTheme } from '../../../../theme';

interface Props {
  label: string;
  onPress: () => void;
  icon?: IconSource;
  variant?: 'filled' | 'outline' | 'quiet';
  disabled?: boolean;
  busy?: boolean;
}

/** Token-driven button for the new screens. The legacy Button stays for old ones. */
export const PrimaryButton = ({ label, onPress, icon, variant = 'filled', disabled = false, busy = false }: Props) => {
  const { colors, radius, spacing } = useTheme();
  const filled = variant === 'filled';
  const fg = filled ? colors.onAccent : variant === 'outline' ? colors.accent : colors.ink;
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || busy}
      activeOpacity={0.8}
      style={{
        backgroundColor: filled ? colors.accent : colors.transparent,
        borderColor: variant === 'outline' ? colors.accent : colors.transparent,
        borderWidth: 1.5,
        borderRadius: radius.md,
        paddingVertical: spacing.md + 2,
        paddingHorizontal: spacing.lg,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        gap: spacing.sm,
        opacity: disabled ? 0.5 : 1,
      }}
    >
      {busy ? (
        <ActivityIndicator color={fg} />
      ) : (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
          {icon && <Icon icon={icon} color={fg} size={18} strokeWidth={2.5} />}
          <CustomText variant="label" color={fg}>
            {label}
          </CustomText>
        </View>
      )}
    </TouchableOpacity>
  );
};
