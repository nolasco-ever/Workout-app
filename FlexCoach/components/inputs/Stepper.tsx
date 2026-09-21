import React from 'react';
import { TouchableOpacity, View } from 'react-native';
import { CustomText } from '../text/customText';
import { Icon } from '../icons/Icon';
import { generalIcons } from '../icons/icon-library';
import { useTheme } from '../../theme';

interface Props {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  format?: (value: number) => string;
}

export const Stepper = ({ label, value, onChange, min = 0, max = 999, step = 1, format }: Props) => {
  const { colors, radius, spacing } = useTheme();
  const btn = (icon: typeof generalIcons.plus, disabled: boolean, onPress: () => void) => (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      hitSlop={6}
      style={{ width: 36, height: 36, borderRadius: radius.sm, backgroundColor: colors.surfaceRaised, alignItems: 'center', justifyContent: 'center', opacity: disabled ? 0.4 : 1 }}
    >
      <Icon icon={icon} size={18} strokeWidth={2.5} />
    </TouchableOpacity>
  );
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: spacing.sm }}>
      <CustomText variant="body">{label}</CustomText>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
        {btn(generalIcons.minus, value - step < min, () => onChange(Math.max(min, value - step)))}
        <View style={{ minWidth: 56, alignItems: 'center' }}>
          <CustomText variant="bodyStrong">{format ? format(value) : String(value)}</CustomText>
        </View>
        {btn(generalIcons.plus, value + step > max, () => onChange(Math.min(max, value + step)))}
      </View>
    </View>
  );
};
