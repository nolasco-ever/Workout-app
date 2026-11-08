import { appendPoints, decodeRoute, encodeRoute, metersBetween, parseWatchPoints, routeMeters, routeToSave, RoutePoint, simplifyRoute } from '../../data/engine/route';
import { parseWatchRoute } from '../../data/liveActivity/watchRoute';

const p = (lat: number, lon: number, t = 0, acc = 5): RoutePoint => ({ lat, lon, t, acc });

describe('outdoor routes (v1 #10.8)', () => {
  it('measures the ground between points', () => {
    // One thousandth of a degree of latitude is about 111 m.
    expect(metersBetween(p(40, -74), p(40.001, -74))).toBeCloseTo(111.2, 0);
    expect(routeMeters([p(40, -74), p(40.001, -74), p(40.002, -74)])).toBeCloseTo(222.4, 0);
  });

  it('keeps good fixes that moved, and drops the rest', () => {
    const line = appendPoints([], [p(40, -74, 1), p(40.00001, -74, 2), p(40.0005, -74, 3, 80), p(40.001, -74, 4), p(40.002, -74, 3)]);
    // The 1 m step, the 80 m accuracy fix and the one out of order are gone.
    expect(line.map(q => q.t)).toEqual([1, 4]);
  });

  it('simplifies a straight run to its ends and keeps the corners', () => {
    const straight = Array.from({ length: 50 }, (_, i) => p(40 + i * 0.0001, -74, i + 1));
    expect(simplifyRoute(straight)).toHaveLength(2);
    const corner = [...straight, ...Array.from({ length: 20 }, (_, i) => p(40.0049, -74 + (i + 1) * 0.0001, 100 + i))];
    expect(simplifyRoute(corner).length).toBe(3);
  });

  it('encodes the line and reads it back to the meter', () => {
    const line = [p(38.5, -120.2), p(40.7, -120.95), p(43.252, -126.453)];
    // Google's own example.
    expect(encodeRoute(line)).toBe('_p~iF~ps|U_ulLnnqC_mqNvxq`@');
    decodeRoute(encodeRoute(line)).forEach((q, i) => {
      expect(q.lat).toBeCloseTo(line[i].lat, 5);
      expect(q.lon).toBeCloseTo(line[i].lon, 5);
    });
  });

  it('saves nothing for a line too short to draw', () => {
    expect(routeToSave([p(40, -74)])).toBeNull();
    expect(typeof routeToSave([p(40, -74), p(40.001, -74)])).toBe('string');
  });

  it('reads the Watch readings', () => {
    expect(parseWatchPoints('40.1,-74.2,1000,6;bad;40.2,-74.3')).toEqual([p(40.1, -74.2, 1000, 6), { lat: 40.2, lon: -74.3, t: 0, acc: 0 }]);
  });
});

describe('the Watch route message', () => {
  it('reads the set and its points', () => {
    expect(parseWatchRoute('set-1|40.1,-74.2,1000,6;40.2,-74.3,2000,5')).toEqual({ setId: 'set-1', points: [p(40.1, -74.2, 1000, 6), p(40.2, -74.3, 2000, 5)] });
    expect(parseWatchRoute('|40,1')).toBeNull();
    expect(parseWatchRoute('set|')).toBeNull();
  });
});
