import { useColorScheme } from 'react-native';
import { useThemeContext } from '../packages/core-contexts/theme-context';
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

/** Resolve the active scheme from the user's choice or the system setting. */
export const useIsDark = (): boolean => {
  const { appTheme } = useThemeContext();
  const system = useColorScheme();
  const chosen = appTheme === 'system' ? system : appTheme;
  return chosen !== 'light';
};

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
