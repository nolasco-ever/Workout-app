import { reactedAgo } from '../../data/engine/buddies';

describe('reactedAgo', () => {
  const now = new Date(2026, 9, 24, 15, 0).getTime();
  it('counts minutes and hours within today', () => {
    expect(reactedAgo(now - 20_000, now)).toBe('now');
    expect(reactedAgo(now - 12 * 60_000, now)).toBe('12m');
    expect(reactedAgo(now - 3 * 3_600_000, now)).toBe('3h');
  });
  it('says Yesterday for the day before, then the date', () => {
    expect(reactedAgo(new Date(2026, 9, 23, 9, 0).getTime(), now)).toBe('Yesterday');
    expect(reactedAgo(new Date(2026, 9, 7, 9, 0).getTime(), now)).toMatch(/Oct\s7/);
  });
});
