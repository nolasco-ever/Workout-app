import React from 'react';
import { Text as RNText, TextStyle, TextProps as RNTextProps } from 'react-native';
import { colors } from '../../colors';

type TextProps = RNTextProps & {
  type?: 'header' | 'subheader' | 'body';
  centered?: boolean;
};

export const CustomText: React.FC<TextProps> = ({ type='body', centered=false, children }) => {
    const appColors = colors();
  const textStyles: TextStyle = {
    color: type === 'subheader' ? appColors.subtext : appColors.text,
    fontSize: type === 'header' ? 24 : type === 'subheader' ? 18 : 16,
    fontWeight: type === 'header' || 'subheader' ? 'bold' : 'normal',
    textAlign: centered ? 'center' : 'left'
  };

  return <RNText style={textStyles}>{children}</RNText>;
};