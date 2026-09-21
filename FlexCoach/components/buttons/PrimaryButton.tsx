import React from 'react';
import { ActivityIndicator, TouchableOpacity, View } from 'react-native';
import { CustomText } from '../text/customText';
import { Icon, IconSource } from '../icons/Icon';
import { useTheme } from '../../theme';

interface Props {
  label: string;
  onPress: () => void;
  icon?: IconSource;
  variant?: 'filled' | 'outline' | 'quiet';
  /** Destructive swaps the accent for the error color. */
  tone?: 'accent' | 'destructive';
  disabled?: boolean;
  busy?: boolean;
}

/** Token-driven button for the new screens. The legacy Button stays for old ones. */
export const PrimaryButton = ({ label, onPress, icon, variant = 'filled', tone = 'accent', disabled = false, busy = false }: Props) => {
  const { colors, radius, spacing } = useTheme();
  const filled = variant === 'filled';
  const accent = tone === 'destructive' ? colors.error : colors.accent;
  const fg = filled ? colors.onAccent : variant === 'outline' ? accent : colors.ink;
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || busy}
      activeOpacity={0.8}
      style={{
        backgroundColor: filled ? accent : colors.transparent,
        borderColor: variant === 'outline' ? accent : colors.transparent,
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
