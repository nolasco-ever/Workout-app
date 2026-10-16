import { useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/**
 * How far from the top edge our own header rows sit beside the column: level
 * with the camera, clear of the display's round corners. The closed outer
 * display and the open inner display put the camera at different heights.
 */
export const SIDE_RAIL_TOP_CLOSED = 22;
export const SIDE_RAIL_TOP_OPEN = 32;
/** Narrower than this, the window is a folding phone's outer display (466 pt) or a phone; wider is the open inner display. */
const OPEN_WIDTH = 600;

/**
 * On a folding phone the status bar, the Dynamic Island and the system bars
 * stand in a column along the right edge of the display, and the top inset
 * is 0. That column arrives as the right safe-area inset; on an ordinary
 * phone in portrait the right inset is 0. `rail` is true when the right edge
 * is that column, so chrome of our own keeps to the left; `top` is where a
 * header row of our own starts: the usual top inset, or beside the column a
 * fixed distance level with the camera.
 */
export const useSideRail = (): { rail: boolean; top: number; buttonTop: number } => {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const rail = insets.right > 0;
  const top = rail ? (width < OPEN_WIDTH ? SIDE_RAIL_TOP_CLOSED : SIDE_RAIL_TOP_OPEN) : insets.top;
  // The running workout centres its 44-pt buttons in a 56-pt row below `top`; other rows line their buttons up with that.
  return { rail, top, buttonTop: top + 6 };
};
