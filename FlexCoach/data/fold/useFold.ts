import { useEffect, useState } from 'react';
import { useWindowDimensions } from 'react-native';
import NativeFold, { NativeFoldState } from '../../specs/NativeFold';

/**
 * How a folding phone is held. Apple's names, with Android's mapped onto
 * them: `book` is half open with the hinge upright, `tabletop` half open
 * with the hinge flat like a laptop (Samsung's Flex mode), `tent` standing
 * on its edges with the outer display in use. A phone that does not fold is
 * `unknown`, and so is a folding phone before its first report.
 */
export type Posture = 'closed' | 'open' | 'book' | 'tabletop' | 'tent' | 'unknown';
export type HingeStatus = 'closed' | 'partiallyOpen' | 'fullyOpen' | 'unknown' | 'none';
export type Rect = { x: number; y: number; width: number; height: number };

export type FoldState = {
  /** The phone has a hinge or a fold, whatever pose it is in. */
  foldable: boolean;
  posture: Posture;
  hinge: { status: HingeStatus; angleDeg: number | null };
  /** Where the fold crosses the window, in points; `active` only while the phone is partly folded. Null on a phone that does not fold, and on the outer display. */
  fold: { axis: 'vertical' | 'horizontal'; rect: Rect; active: boolean } | null;
  /** The two areas either side of an active fold, in window points: left and right of an upright fold, above and below a flat one. */
  halves: [Rect, Rect] | null;
  window: { width: number; height: number };
};

const POSTURES: Posture[] = ['closed', 'open', 'book', 'tabletop', 'tent', 'unknown'];
const STATUSES: HingeStatus[] = ['closed', 'partiallyOpen', 'fullyOpen', 'unknown', 'none'];

export const NEUTRAL_FOLD: FoldState = {
  foldable: false,
  posture: 'unknown',
  hinge: { status: 'none', angleDeg: null },
  fold: null,
  halves: null,
  window: { width: 0, height: 0 },
};

/** The native record, typed and with the halves worked out. */
export const toFoldState = (n: NativeFoldState): FoldState => {
  const posture = POSTURES.includes(n.posture as Posture) ? (n.posture as Posture) : 'unknown';
  const status = STATUSES.includes(n.hingeStatus as HingeStatus) ? (n.hingeStatus as HingeStatus) : 'unknown';
  const window = { width: n.windowWidth, height: n.windowHeight };
  const axis: 'vertical' | 'horizontal' | null = n.foldAxis === 'vertical' ? 'vertical' : n.foldAxis === 'horizontal' ? 'horizontal' : null;
  const fold = axis ? { axis, rect: { x: n.foldX, y: n.foldY, width: n.foldWidth, height: n.foldHeight }, active: n.foldActive } : null;
  let halves: [Rect, Rect] | null = null;
  if (fold && fold.active) {
    const r = fold.rect;
    halves =
      fold.axis === 'vertical'
        ? [
            { x: 0, y: 0, width: Math.max(0, r.x), height: window.height },
            { x: r.x + r.width, y: 0, width: Math.max(0, window.width - r.x - r.width), height: window.height },
          ]
        : [
            { x: 0, y: 0, width: window.width, height: Math.max(0, r.y) },
            { x: 0, y: r.y + r.height, width: window.width, height: Math.max(0, window.height - r.y - r.height) },
          ];
  }
  return { foldable: n.foldable, posture, hinge: { status, angleDeg: n.hingeAngleDeg < 0 ? null : n.hingeAngleDeg }, fold, halves, window };
};

/** The state right now, for code outside React. Neutral where the module is absent (a phone that does not fold, Jest). */
export const getFoldState = (): FoldState => (NativeFold ? toFoldState(NativeFold.getState()) : NEUTRAL_FOLD);

/**
 * The folding phone's pose, hinge and fold, live. Re-renders on every change
 * the native side reports: a fold, an unfold, a rotation, a move between
 * displays. On a phone that does not fold it is the neutral state and never
 * changes.
 */
export const useFold = (): FoldState => {
  const [state, setState] = useState<FoldState>(getFoldState);
  const { width, height } = useWindowDimensions();
  useEffect(() => {
    const native = NativeFold;
    if (!native) return;
    setState(toFoldState(native.getState()));
    const subscription = native.onChange(next => setState(toFoldState(next)));
    // The native side finds the window a moment after the module exists; read again once it has.
    const settle = setTimeout(() => setState(toFoldState(native.getState())), 1500);
    return () => {
      subscription.remove();
      clearTimeout(settle);
    };
  }, []);
  // A fold, unfold or rotation also changes the window; re-read on each, in case a report was missed.
  useEffect(() => {
    if (NativeFold) setState(toFoldState(NativeFold.getState()));
  }, [width, height]);
  return state;
};
