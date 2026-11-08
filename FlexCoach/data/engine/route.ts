/**
 * An outdoor cardio route (v1 #10.8): the line marking the path taken. Points
 * come from the phone's GPS, or from the Watch's when a Watch is tracking the
 * workout (owner, 2026-11-08). The line is simplified before it is saved
 * (about one point every 10 m of bend) and stored as an encoded polyline, so
 * a half-hour run is a few kilobytes on the session.
 */
export interface RoutePoint {
  lat: number;
  lon: number;
  /** ms since 1970; 0 when unknown (points from a saved line). */
  t: number;
  /** Horizontal accuracy in meters; 0 when unknown. */
  acc: number;
}

const EARTH_M = 6371000;
const rad = (d: number) => (d * Math.PI) / 180;

/** Meters between two points on the ground. */
export const metersBetween = (a: Pick<RoutePoint, 'lat' | 'lon'>, b: Pick<RoutePoint, 'lat' | 'lon'>): number => {
  const dLat = rad(b.lat - a.lat);
  const dLon = rad(b.lon - a.lon);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_M * Math.asin(Math.min(1, Math.sqrt(h)));
};

/** The length of the line in meters. */
export const routeMeters = (points: Pick<RoutePoint, 'lat' | 'lon'>[]): number => {
  let m = 0;
  for (let i = 1; i < points.length; i++) m += metersBetween(points[i - 1], points[i]);
  return m;
};

/** Readings vaguer than this are dropped: a fix indoors or under trees can be off by a block. */
export const MAX_ACCURACY_M = 30;
/** A step shorter than this is standing still or GPS wander, not progress. */
export const MIN_STEP_M = 4;

/** New readings added to the line, keeping only good fixes that moved. */
export const appendPoints = (line: RoutePoint[], incoming: RoutePoint[]): RoutePoint[] => {
  const out = [...line];
  for (const p of incoming) {
    if (!Number.isFinite(p.lat) || !Number.isFinite(p.lon) || Math.abs(p.lat) > 90 || Math.abs(p.lon) > 180) continue;
    if (p.acc > MAX_ACCURACY_M) continue;
    const last = out[out.length - 1];
    if (last && (p.t && last.t && p.t <= last.t)) continue;
    if (last && metersBetween(last, p) < MIN_STEP_M) continue;
    out.push(p);
  }
  return out;
};

/** Perpendicular distance in meters from `p` to the segment a–b, on a flat patch of ground around them. */
const offLine = (p: RoutePoint, a: RoutePoint, b: RoutePoint): number => {
  const k = Math.cos(rad((a.lat + b.lat) / 2));
  const x = (q: RoutePoint) => rad(q.lon) * k * EARTH_M;
  const y = (q: RoutePoint) => rad(q.lat) * EARTH_M;
  const [ax, ay, bx, by, px, py] = [x(a), y(a), x(b), y(b), x(p), y(p)];
  const dx = bx - ax;
  const dy = by - ay;
  const len2 = dx * dx + dy * dy;
  const t = len2 ? Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / len2)) : 0;
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
};

/** The same path with fewer points: any point within `toleranceM` of the line between its neighbours goes (Douglas-Peucker). */
export const simplifyRoute = (points: RoutePoint[], toleranceM = 10): RoutePoint[] => {
  if (points.length <= 2) return points;
  const keep = new Array<boolean>(points.length).fill(false);
  keep[0] = keep[points.length - 1] = true;
  const stack: [number, number][] = [[0, points.length - 1]];
  while (stack.length) {
    const [from, to] = stack.pop()!;
    let worst = -1;
    let at = -1;
    for (let i = from + 1; i < to; i++) {
      const d = offLine(points[i], points[from], points[to]);
      if (d > worst) {
        worst = d;
        at = i;
      }
    }
    if (at !== -1 && worst > toleranceM) {
      keep[at] = true;
      stack.push([from, at], [at, to]);
    }
  }
  return points.filter((_, i) => keep[i]);
};

// Google's encoded polyline format, five decimal places (about a meter).
const encodeValue = (v: number): string => {
  let n = v < 0 ? ~(v << 1) : v << 1;
  let s = '';
  while (n >= 0x20) {
    s += String.fromCharCode((0x20 | (n & 0x1f)) + 63);
    n >>= 5;
  }
  return s + String.fromCharCode(n + 63);
};

export const encodeRoute = (points: Pick<RoutePoint, 'lat' | 'lon'>[]): string => {
  let lat = 0;
  let lon = 0;
  let out = '';
  for (const p of points) {
    const la = Math.round(p.lat * 1e5);
    const lo = Math.round(p.lon * 1e5);
    out += encodeValue(la - lat) + encodeValue(lo - lon);
    lat = la;
    lon = lo;
  }
  return out;
};

export const decodeRoute = (line: string): RoutePoint[] => {
  const points: RoutePoint[] = [];
  let i = 0;
  let lat = 0;
  let lon = 0;
  const next = (): number | null => {
    let shift = 0;
    let result = 0;
    let b: number;
    do {
      if (i >= line.length) return null;
      b = line.charCodeAt(i++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    return result & 1 ? ~(result >> 1) : result >> 1;
  };
  while (i < line.length) {
    const dLat = next();
    const dLon = next();
    if (dLat === null || dLon === null) break;
    lat += dLat;
    lon += dLon;
    points.push({ lat: lat / 1e5, lon: lon / 1e5, t: 0, acc: 0 });
  }
  return points;
};

/** The line ready to save: simplified and encoded; null with fewer than two points. */
export const routeToSave = (points: RoutePoint[]): string | null => (points.length >= 2 ? encodeRoute(simplifyRoute(points)) : null);

/** "lat,lon,t,acc;…", as the Watch sends its readings; anything malformed is skipped. */
export const parseWatchPoints = (text: string): RoutePoint[] =>
  text
    .split(';')
    .map(chunk => chunk.split(',').map(Number))
    .filter(v => v.length >= 2 && Number.isFinite(v[0]) && Number.isFinite(v[1]))
    .map(([lat, lon, t = 0, acc = 0]) => ({ lat, lon, t: Number.isFinite(t) ? t : 0, acc: Number.isFinite(acc) ? acc : 0 }));

/** How much of each end of a route buddies never see (owner, 2026-11-07): about where a run starts and ends, often home. */
export const HIDDEN_END_M = 200;

/** The route less its first and last `meters` along the path; empty when nothing is left between them. */
export const trimRouteEnds = (points: RoutePoint[], meters = HIDDEN_END_M): RoutePoint[] => {
  const from = (list: RoutePoint[]): number => {
    let walked = 0;
    for (let i = 1; i < list.length; i++) {
      walked += metersBetween(list[i - 1], list[i]);
      if (walked >= meters) return i;
    }
    return list.length;
  };
  const start = from(points);
  const end = points.length - from([...points].reverse());
  return start < end - 1 ? points.slice(start, end) : [];
};

/** The saved line as buddies may see it: its ends cut off; null when too short to show anything. */
export const sharedRouteLine = (line: string): string | null => {
  const middle = trimRouteEnds(decodeRoute(line));
  return middle.length >= 2 ? encodeRoute(middle) : null;
};
