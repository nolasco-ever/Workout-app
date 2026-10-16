import React, { useContext } from 'react';
import { SafeAreaView as NativeSafeAreaView, type Edge, type SafeAreaViewProps } from 'react-native-safe-area-context';
import { BottomTabBarHeightContext } from 'react-native-bottom-tabs';

const ALL: readonly Edge[] = ['top', 'right', 'bottom', 'left'];

/**
 * The app's safe-area view; every screen uses this instead of the library's.
 *
 * Inside the tabs the side edges are honoured: on a folding phone the tab bar
 * stands in a column at the side of the display, and content keeps clear of
 * it. Everywhere else (modals, the running workout, screens pushed over the
 * tabs) the sides are dropped and content runs the full width; the only thing
 * in that column then is the status bar's clock, which may sit over a corner
 * of the content. On an ordinary phone the sides are zero either way.
 */
export const SafeAreaView = ({ edges, ...rest }: SafeAreaViewProps) => {
  const inTabs = useContext(BottomTabBarHeightContext) != null;
  const wanted = Array.isArray(edges) ? edges : ALL;
  const resolved = inTabs || !Array.isArray(wanted) ? wanted : wanted.filter(e => e !== 'left' && e !== 'right');
  return <NativeSafeAreaView edges={Array.isArray(edges) || edges === undefined ? resolved : edges} {...rest} />;
};
