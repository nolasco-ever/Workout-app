import { cardioScreenKind, paceSecPer, speedPerHour } from '../../data/engine/cardioScreen';
import { WATCH_LIVE_STALE_MS, freshWatchLive, parseWatchLive } from '../../data/liveActivity/watchLive';

describe('cardio screen kinds (v1 #10.6)', () => {
  it('shows distance and pace outdoors and on a treadmill, with the map only outdoors', () => {
    expect(cardioScreenKind('0685')).toEqual({ stats: ['distance', 'pace', 'heartRate', 'calories'], behind: 'map', glyph: 'run', scan: false });
    expect(cardioScreenKind('0684')).toEqual({ stats: ['distance', 'pace', 'heartRate', 'calories'], behind: 'graphic', glyph: 'run', scan: true });
  });

  it('shows speed on an outdoor ride, skating included', () => {
    expect(cardioScreenKind('Bicycling').stats).toEqual(['distance', 'speed', 'heartRate', 'calories']);
    expect(cardioScreenKind('Skating').behind).toBe('map');
  });

  it('shows only heart rate and calories on machines that go nowhere, and offers the scan', () => {
    for (const id of ['2138', '2141', '2311', 'Rowing_Stationary', '2142']) {
      expect(cardioScreenKind(id).stats).toEqual(['heartRate', 'calories']);
      expect(cardioScreenKind(id).scan).toBe(true);
    }
    expect(cardioScreenKind('Rowing_Stationary').glyph).toBe('rower');
  });

  it('shows distance on a swim, with no scan', () => {
    expect(cardioScreenKind('x_Swimming')).toEqual({ stats: ['distance', 'heartRate', 'calories'], behind: 'graphic', glyph: 'swim', scan: false });
  });

  it('falls back to general cardio, no console', () => {
    expect(cardioScreenKind('nope')).toEqual({ stats: ['heartRate', 'calories'], behind: 'graphic', glyph: 'cardio', scan: false });
  });
});

describe('pace and speed', () => {
  it('works out pace per mile and per km', () => {
    expect(paceSecPer(1609.344, 600, 'mi')).toBeCloseTo(600);
    expect(paceSecPer(2000, 600, 'km')).toBeCloseTo(300);
  });

  it('works out speed per hour', () => {
    expect(speedPerHour(10000, 1800, 'km')).toBeCloseTo(20);
  });

  it('waits for some distance', () => {
    expect(paceSecPer(null, 60, 'mi')).toBeNull();
    expect(paceSecPer(5, 60, 'mi')).toBeNull();
    expect(speedPerHour(500, 0, 'km')).toBeNull();
  });
});

describe('live numbers from the Watch', () => {
  it('reads what the Watch sends', () => {
    expect(parseWatchLive('set-1:2300.5:146.2:182.7', 1000)).toEqual({ setId: 'set-1', live: { meters: 2300.5, bpm: 146, kcal: 183, at: 1000 } });
  });

  it('reads no distance and no heart rate yet', () => {
    expect(parseWatchLive('s:-1:0:0', 5)).toEqual({ setId: 's', live: { meters: null, bpm: null, kcal: 0, at: 5 } });
  });

  it('rejects anything else', () => {
    expect(parseWatchLive('s:1:2', 0)).toBeNull();
    expect(parseWatchLive(':1:2:3', 0)).toBeNull();
    expect(parseWatchLive('s:x:2:3', 0)).toBeNull();
  });

  it('drops a reading once it is stale', () => {
    const live = { meters: null, bpm: 120, kcal: 10, at: 0 };
    expect(freshWatchLive(live, WATCH_LIVE_STALE_MS)).toBe(live);
    expect(freshWatchLive(live, WATCH_LIVE_STALE_MS + 1)).toBeNull();
  });
});
