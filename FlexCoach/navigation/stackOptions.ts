import { Platform } from 'react-native';
import type { NativeStackNavigationOptions } from '@react-navigation/native-stack';
import { useTheme } from '../theme';
import { useSideRail } from './useSideRail';

/**
 * Shared native-stack header styling. On iOS the header background is left
 * to the system so iOS 26 renders Liquid Glass and older versions their
 * translucent bar; Android paints the ground colour.
 */
/** The header title beside a folding phone's status column: it floats small at the top left there, so it gets the size of a screen title. */
const SIDE_RAIL_TITLE_SIZE = 24;

export const useStackOptions = () => {
  const { colors, fonts } = useTheme();
  const { rail } = useSideRail();
  const base: NativeStackNavigationOptions = {
    headerTintColor: colors.accent,
    headerTitleStyle: { fontFamily: fonts.display.semibold, fontSize: rail ? SIDE_RAIL_TITLE_SIZE : 17, color: colors.ink },
    headerLargeTitleStyle: { fontFamily: fonts.display.bold, color: colors.ink },
    headerBackButtonDisplayMode: 'minimal',
    headerShadowVisible: false,
    // Portrait everywhere (the folding phone's inner display ignores this and turns anyway); the live session lifts it on a folding phone for tent mode, see useSessionOrientation.
    orientation: 'portrait',
    contentStyle: { backgroundColor: colors.ground },
    ...(Platform.OS === 'android' ? { headerStyle: { backgroundColor: colors.ground } } : {}),
  };
  /** A pushed screen with a plain title. */
  const screen = (title: string): NativeStackNavigationOptions => ({ ...base, headerShown: true, title });
  /** A tab root with a large collapsing title. */
  const root = (title: string): NativeStackNavigationOptions => ({ ...base, headerShown: true, title, headerLargeTitle: true });
  /** A tab root that draws its own title row (see TabHeader) and no native header. */
  const tabRoot = (title: string): NativeStackNavigationOptions => ({ ...base, headerShown: false, title });
  /** A sheet-style modal with a close button, and optionally an action on the right. */
  const modal = (title: string, headerLeft: NativeStackNavigationOptions['headerLeft'], headerRight?: NativeStackNavigationOptions['headerRight']): NativeStackNavigationOptions => ({
    ...base,
    headerShown: true,
    title,
    presentation: 'modal',
    headerLeft,
    headerRight,
  });
  return { base, screen, root, tabRoot, modal };
};
