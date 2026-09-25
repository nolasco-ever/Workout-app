import { Platform } from 'react-native';
import type { NativeStackNavigationOptions } from '@react-navigation/native-stack';
import { useTheme } from '../theme';

/**
 * Shared native-stack header styling. On iOS the header background is left
 * to the system so iOS 26 renders Liquid Glass and older versions their
 * translucent bar; Android paints the ground colour.
 */
export const useStackOptions = () => {
  const { colors, fonts } = useTheme();
  const base: NativeStackNavigationOptions = {
    headerTintColor: colors.accent,
    headerTitleStyle: { fontFamily: fonts.display.semibold, fontSize: 17, color: colors.ink },
    headerLargeTitleStyle: { fontFamily: fonts.display.bold, color: colors.ink },
    headerBackButtonDisplayMode: 'minimal',
    headerShadowVisible: false,
    contentStyle: { backgroundColor: colors.ground },
    ...(Platform.OS === 'android' ? { headerStyle: { backgroundColor: colors.ground } } : {}),
  };
  /** A pushed screen with a plain title. */
  const screen = (title: string): NativeStackNavigationOptions => ({ ...base, headerShown: true, title });
  /** A tab root with a large collapsing title. */
  const root = (title: string): NativeStackNavigationOptions => ({ ...base, headerShown: true, title, headerLargeTitle: true });
  /** A tab root that draws its own title row (see TabHeader) and no native header. */
  const tabRoot = (title: string): NativeStackNavigationOptions => ({ ...base, headerShown: false, title });
  /** A sheet-style modal with a close button. */
  const modal = (title: string, headerLeft: NativeStackNavigationOptions['headerLeft']): NativeStackNavigationOptions => ({
    ...base,
    headerShown: true,
    title,
    presentation: 'modal',
    headerLeft,
  });
  return { base, screen, root, tabRoot, modal };
};
