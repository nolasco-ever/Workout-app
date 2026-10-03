import { niceTicks } from '../../components/charts/scale';

describe('niceTicks', () => {
  it('always ends on or above the maximum so bars never pass the top gridline', () => {
    const ticks = niceTicks(0, 6, 3);
    expect(ticks[0]).toBe(0);
    expect(ticks[ticks.length - 1]).toBeGreaterThanOrEqual(6);
    for (const max of [1, 3, 7, 12, 95, 1480]) {
      const t = niceTicks(0, max, 3);
      expect(t[t.length - 1]).toBeGreaterThanOrEqual(max);
    }
  });

  it('keeps round steps and lands exactly on a value that is already a tick', () => {
    expect(niceTicks(0, 10, 4)).toEqual([0, 5, 10]);
    expect(niceTicks(0, 5, 3)).toEqual([0, 2, 4, 6]);
  });
});
