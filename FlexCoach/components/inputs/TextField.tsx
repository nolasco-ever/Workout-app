import React from 'react';
import { TextInput, TextInputProps, View } from 'react-native';
import { CustomText } from '../text/customText';
import { useTheme } from '../../theme';

interface Props extends TextInputProps {
  label?: string;
  hint?: string;
  error?: string | null;
  suffix?: string;
}

/** Token-driven text input with an optional label, hint, error, and unit suffix. */
export const TextField = ({ label, hint, error, suffix, style, ...rest }: Props) => {
  const { colors, radius, spacing, fonts } = useTheme();
  return (
    <View style={{ gap: spacing.xs }}>
      {label && <CustomText variant="overline" color={colors.inkMuted}>{label}</CustomText>}
      <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderWidth: 1, borderColor: error ? colors.error : colors.line, borderRadius: radius.md, paddingHorizontal: spacing.md }}>
        <TextInput
          placeholderTextColor={colors.inactive}
          {...rest}
          style={[{ flex: 1, fontFamily: fonts.body.medium, fontSize: 16, color: colors.ink, paddingVertical: spacing.md }, style]}
        />
        {suffix && <CustomText variant="caption" color={colors.inkMuted}>{suffix}</CustomText>}
      </View>
      {(error || hint) && <CustomText variant="caption" color={error ? colors.error : colors.inkMuted}>{error ?? hint}</CustomText>}
    </View>
  );
};
