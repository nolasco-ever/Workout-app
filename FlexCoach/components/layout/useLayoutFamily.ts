import { useContext } from 'react';
import { useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BottomTabBarHeightContext } from 'react-native-bottom-tabs';

/**
 * Which arrangement a screen draws, from the width it actually has.
 *
 * `phone` is every phone and a folding phone's outer display: one column.
 * `medium` is a folding phone's inner display held upright (669 pt) and
 * small tablets: still one column, but cards go wide and pair up.
 * `wide` is the inner display on its side (867 pt of content) and tablets:
 * two columns.
 *
 * Inside the tabs the side insets come off the width, as the screen's
 * SafeAreaView takes them; elsewhere content runs the full window. The
 * window's width reaches JavaScript a beat after a fold; a change of
 * family is a whole new arrangement anyway, so that beat is fine here. Lay
 * the arrangement itself out with flex and percentages, not this width.
 */
export type LayoutFamily = 'phone' | 'medium' | 'wide';

export const WIDE_MIN = 700;
export const MEDIUM_MIN = 560;

export const useLayoutFamily = (): LayoutFamily => {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const inTabs = useContext(BottomTabBarHeightContext) != null;
  const content = inTabs ? width - insets.left - insets.right : width;
  return content >= WIDE_MIN ? 'wide' : content >= MEDIUM_MIN ? 'medium' : 'phone';
};
