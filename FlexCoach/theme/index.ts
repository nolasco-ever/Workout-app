import { useColorScheme } from 'react-native';
import { ColorTokens, ironDark, ironLight } from './palette';
import { fonts, typography } from './typography';
import { iconSize, radius, spacing } from './spacing';

export * from './palette';
export * from './typography';
export * from './spacing';

export interface Theme {
  colors: ColorTokens;
  typography: typeof typography;
  fonts: typeof fonts;
  spacing: typeof spacing;
  radius: typeof radius;
  iconSize: typeof iconSize;
  isDark: boolean;
}

/** The app mirrors the phone's appearance setting. */
export const useIsDark = (): boolean => useColorScheme() === 'dark';

export const useTheme = (): Theme => {
  const isDark = useIsDark();
  return {
    colors: isDark ? ironDark : ironLight,
    typography,
    fonts,
    spacing,
    radius,
    iconSize,
    isDark,
  };
};
