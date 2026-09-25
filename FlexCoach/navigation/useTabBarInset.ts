import { useContext } from 'react';
import { Platform } from 'react-native';
import { BottomTabBarHeightContext } from 'react-native-bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/**
 * Extra bottom space a screen inside the tab navigator must keep clear, on
 * top of the safe-area inset it already handles.
 *
 * On iOS the native tab bar is translucent and floats over the content, and
 * UIKit does not fold its height into the safe area the screens see, so a
 * footer or scroll view that only pads by the home indicator ends up under
 * the bar. The measured bar height already includes the home indicator, so
 * only the part above it is returned. Android lays the bar out below the
 * content, and screens outside the tabs (modals, the Plans flow) have no bar,
 * so both get 0.
 */
export const useTabBarInset = (): number => {
  const tabBar = useContext(BottomTabBarHeightContext) ?? 0;
  const { bottom } = useSafeAreaInsets();
  if (Platform.OS !== 'ios') return 0;
  return Math.max(0, tabBar - bottom);
};

/**
 * Bottom padding for content that runs all the way under the tab bar: the
 * bar plus the home indicator. Use it on a scroll view (or a footer) inside
 * a SafeAreaView that does NOT pad the bottom edge. Padding the safe-area
 * edge instead stops the content at a hard line above the screen bottom,
 * which shows through the translucent bar as a clipped edge.
 */
export const useTabScrollInset = (): number => {
  const tabBar = useContext(BottomTabBarHeightContext) ?? 0;
  const { bottom } = useSafeAreaInsets();
  if (Platform.OS !== 'ios') return bottom;
  return Math.max(tabBar, bottom);
};
