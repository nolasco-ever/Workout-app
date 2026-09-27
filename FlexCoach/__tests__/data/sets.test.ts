import { renumberSets } from '../../data/engine/sets';
import { LoggedSet } from '../../data/models';

const set = (id: string, warmup = false): LoggedSet => ({ id, setNumber: 0, weightKg: null, reps: null, durationSec: null, distanceM: null, completed: false, completedAt: null, warmup });

describe('renumberSets', () => {
  it('numbers warm-ups and working sets separately', () => {
    const out = renumberSets([set('w1', true), set('w2', true), set('a'), set('b'), set('c')]);
    expect(out.map(s => `${s.warmup ? 'W' : ''}${s.setNumber}`)).toEqual(['W1', 'W2', '1', '2', '3']);
  });

  it('closes the gap after a removal', () => {
    const out = renumberSets([set('w1', true), set('a'), set('c')]);
    expect(out.map(s => s.setNumber)).toEqual([1, 1, 2]);
  });
});
