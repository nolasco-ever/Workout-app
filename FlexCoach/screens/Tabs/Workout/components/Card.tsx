import React from 'react';
import { StyleProp, View, ViewStyle } from 'react-native';
import { useTheme } from '../../../../theme';

/** A surface with the standard radius and hairline. The Workout tab's building block. */
export const Card = ({ children, style, tone = 'surface' }: { children: React.ReactNode; style?: StyleProp<ViewStyle>; tone?: 'surface' | 'accent' }) => {
  const { colors, radius, spacing } = useTheme();
  return (
    <View
      style={[
        {
          backgroundColor: tone === 'accent' ? colors.accentTint : colors.surface,
          borderColor: tone === 'accent' ? colors.transparent : colors.line,
          borderWidth: 1,
          borderRadius: radius.lg,
          padding: spacing.lg,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
};
