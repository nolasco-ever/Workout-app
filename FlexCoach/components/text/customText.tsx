import React from 'react';
import { Text as RNText, TextStyle, TextProps as RNTextProps, StyleProp } from 'react-native';
import { useTheme, TypographyToken } from '../../theme';

type TextProps = RNTextProps & {
  /** Legacy names kept for existing screens; prefer `variant`. */
  type?: 'header' | 'subheader' | 'body';
  variant?: TypographyToken;
  color?: string;
  centered?: boolean;
  style?: StyleProp<TextStyle>;
};

const legacyVariant: Record<NonNullable<TextProps['type']>, TypographyToken> = {
  header: 'title',
  subheader: 'heading',
  body: 'body',
};

export const CustomText: React.FC<TextProps> = ({ type = 'body', variant, color, centered = false, style, children, ...rest }) => {
  const theme = useTheme();
  const token = theme.typography[variant ?? legacyVariant[type]];
  const textStyles: TextStyle = {
    ...token,
    color: color ?? (type === 'subheader' && !variant ? theme.colors.inkMuted : theme.colors.ink),
    textAlign: centered ? 'center' : 'left',
  };

  return (
    <RNText {...rest} style={[textStyles, style]}>
      {children}
    </RNText>
  );
};
