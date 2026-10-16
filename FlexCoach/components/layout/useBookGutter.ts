import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFold } from '../../data/fold/useFold';

/**
 * Where a two-pane screen splits while a folding phone is held like a
 * book: half open, hinge upright. The panes then sit either side of the
 * crease, with the crease itself as the gap, so no button or heading lands
 * on the fold. Lists and other scrolling content may still cross it.
 */
export type BookGutter = {
  /** The left pane's width, in the screen's own coordinates (the window's left half less whatever left inset the screen's SafeAreaView took). */
  left: number;
  /** The crease's width: the gap between the panes. */
  gap: number;
};

/** The book pose's split, or null in every other pose (flat open, closed, laptop, a phone that does not fold): the screen then uses its usual widths. */
export const useBookGutter = (): BookGutter | null => {
  const { fold, halves, window } = useFold();
  const insets = useSafeAreaInsets();
  if (!fold || !fold.active || fold.axis !== 'vertical' || !halves) return null;
  const left = halves[0].width - insets.left;
  // A crease is near the middle; a report that puts it elsewhere is a half-read mid-fold and is not laid out to.
  if (window.width <= 0 || left < window.width * 0.3 || left > window.width * 0.7) return null;
  return { left, gap: fold.rect.width };
};
