import { NEUTRAL_FOLD, getFoldState, toFoldState } from '../../data/fold/useFold';
import type { NativeFoldState } from '../../specs/NativeFold';

const base: NativeFoldState = {
  foldable: true,
  posture: 'open',
  hingeStatus: 'fullyOpen',
  hingeAngleDeg: 180,
  foldAxis: 'vertical',
  foldX: 455.5,
  foldY: 0,
  foldWidth: 40,
  foldHeight: 669,
  foldActive: false,
  windowWidth: 951,
  windowHeight: 669,
};

describe('fold state', () => {
  it('is neutral without the native module (Jest, a phone that does not fold)', () => {
    expect(getFoldState()).toEqual(NEUTRAL_FOLD);
  });

  it('types the native record and keeps an inactive fold without halves', () => {
    const s = toFoldState(base);
    expect(s.posture).toBe('open');
    expect(s.hinge).toEqual({ status: 'fullyOpen', angleDeg: 180 });
    expect(s.fold).toEqual({ axis: 'vertical', rect: { x: 455.5, y: 0, width: 40, height: 669 }, active: false });
    expect(s.halves).toBeNull();
  });

  it('splits the window left and right of an upright fold (book)', () => {
    const s = toFoldState({ ...base, posture: 'book', hingeStatus: 'partiallyOpen', hingeAngleDeg: 128, foldActive: true });
    expect(s.posture).toBe('book');
    expect(s.halves).toEqual([
      { x: 0, y: 0, width: 455.5, height: 669 },
      { x: 495.5, y: 0, width: 455.5, height: 669 },
    ]);
  });

  it('splits the window above and below a flat fold (tabletop)', () => {
    const s = toFoldState({ ...base, posture: 'tabletop', hingeStatus: 'partiallyOpen', hingeAngleDeg: 110, foldAxis: 'horizontal', foldX: 0, foldY: 455.5, foldWidth: 669, foldHeight: 40, foldActive: true, windowWidth: 669, windowHeight: 951 });
    expect(s.halves).toEqual([
      { x: 0, y: 0, width: 669, height: 455.5 },
      { x: 0, y: 495.5, width: 669, height: 455.5 },
    ]);
  });

  it('falls back to unknown for names it does not know, and null for no angle', () => {
    const s = toFoldState({ ...base, posture: 'sideways', hingeStatus: 'ajar', hingeAngleDeg: -1, foldAxis: 'none' });
    expect(s.posture).toBe('unknown');
    expect(s.hinge).toEqual({ status: 'unknown', angleDeg: null });
    expect(s.fold).toBeNull();
  });
});
