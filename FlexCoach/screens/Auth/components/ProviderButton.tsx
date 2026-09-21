import React from 'react';
import { ActivityIndicator, TouchableOpacity, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { CustomText } from '../../../components/text/customText';
import { Icon } from '../../../components/icons/Icon';
import { generalIcons } from '../../../components/icons/icon-library';
import { useTheme } from '../../../theme';

const AppleMark = ({ color }: { color: string }) => (
  <Svg width={20} height={20} viewBox="0 0 24 24">
    <Path fill={color} d="M16.37 12.76c.02 2.75 2.41 3.66 2.44 3.67-.02.07-.38 1.3-1.26 2.58-.76 1.1-1.55 2.2-2.79 2.22-1.22.02-1.61-.72-3-.72-1.4 0-1.83.7-2.98.74-1.2.05-2.11-1.19-2.88-2.29-1.57-2.27-2.77-6.41-1.16-9.2.8-1.39 2.23-2.27 3.78-2.29 1.18-.02 2.29.79 3.01.79.72 0 2.07-.98 3.49-.84.6.03 2.27.24 3.34 1.82-.09.05-2 1.17-1.99 3.52M13.6 5.8c.63-.77 1.06-1.84.94-2.9-.91.04-2.02.61-2.67 1.37-.59.68-1.1 1.77-.96 2.81 1.02.08 2.05-.52 2.69-1.28" />
  </Svg>
);

const GoogleMark = () => (
  <Svg width={20} height={20} viewBox="0 0 48 48">
    <Path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
    <Path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
    <Path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
    <Path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
  </Svg>
);

interface Props {
  provider: 'apple' | 'google' | 'email';
  label: string;
  onPress: () => void;
  busy?: boolean;
}

/** Sign-in provider buttons following each provider's branding guidance. */
export const ProviderButton = ({ provider, label, onPress, busy = false }: Props) => {
  const { colors, radius, spacing, isDark } = useTheme();
  const bg = provider === 'apple' ? (isDark ? '#FFFFFF' : '#000000') : provider === 'google' ? (isDark ? '#131314' : '#FFFFFF') : colors.accent;
  const fg = provider === 'apple' ? (isDark ? '#000000' : '#FFFFFF') : provider === 'google' ? (isDark ? '#E3E3E3' : '#1F1F1F') : colors.onAccent;
  const border = provider === 'google' ? (isDark ? '#8E918F' : '#747775') : bg;
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={busy}
      activeOpacity={0.8}
      style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, backgroundColor: bg, borderColor: border, borderWidth: 1, borderRadius: radius.md, paddingVertical: spacing.md + 2, opacity: busy ? 0.7 : 1 }}
    >
      {busy ? (
        <ActivityIndicator color={fg} />
      ) : (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
          {provider === 'apple' && <AppleMark color={fg} />}
          {provider === 'google' && <GoogleMark />}
          {provider === 'email' && <Icon icon={generalIcons.envelope} color={fg} size={18} />}
          <CustomText variant="label" color={fg}>{label}</CustomText>
        </View>
      )}
    </TouchableOpacity>
  );
};
