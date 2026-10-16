import { useContext } from 'react';
import type { ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BottomTabBarHeightContext } from 'react-native-bottom-tabs';
import { useLayoutFamily } from './useLayoutFamily';

/**
 * The width a one-column screen keeps on a wide window, padding included:
 * a phone's reading width. Narrower windows get nothing, so phones and the
 * closed foldable are untouched.
 */
export const COMFORTABLE_COLUMN = 592;

/**
 * Style for a scroll view's content container (or a column view): full
 * width up to the comfortable width, centred on the display. Inside the
 * tabs the screen already keeps clear of a folding phone's side column, so
 * a column centred in what is left sits off-centre on the display; the
 * margins put it back on the display's centre line (nothing in the side
 * column can reach it there).
 */
export const useComfortableColumn = (): ViewStyle | undefined => {
  const family = useLayoutFamily();
  const insets = useSafeAreaInsets();
  const inTabs = useContext(BottomTabBarHeightContext) != null;
  if (family === 'phone') return undefined;
  const shift = inTabs ? insets.right - insets.left : 0;
  return { width: '100%', maxWidth: COMFORTABLE_COLUMN, alignSelf: 'center', marginLeft: Math.max(0, shift), marginRight: Math.max(0, -shift) };
};
