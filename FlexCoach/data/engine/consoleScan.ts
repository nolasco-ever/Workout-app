import { ConsoleScan, DistanceUnit, LoggedSet } from '../models';
import { M_PER_MI } from './units';

/**
 * Reading a cardio machine's console from a photo (v1 #10.7). The phone's
 * text recognition hands over each piece of text it found with its box
 * (0 to 1 across and down the photo); this pairs the labels with their
 * numbers. Consoles put the label above the number, beside it, or in the
 * same piece ("DIST 2.61", "330 CAL"), so all three are tried. Only
 * distance, calories and average speed are read (owner, 2026-11-08: no
 * incline; time comes from the app's clock).
 */
export interface TextPiece {
  text: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

export type ScanField = 'distance' | 'calories' | 'speed';

export interface ConsoleReading {
  distanceM?: number;
  kcal?: number;
  /** Meters a second. */
  speedMps?: number;
}

const LABELS: Record<ScanField | 'skip', RegExp> = {
  distance: /\b(dist(ance)?|miles?|kilometers?|km|mi)\b/i,
  calories: /\b(cal(orie)?s?|kcal)\b/i,
  speed: /\b(avg\.?\s*speed|speed|mph|km\/h|kph)\b/i,
  // Read past these: their numbers are not ours.
  skip: /\b(time|elapsed|incline|grade|level|resistance|watts?|pace|heart|hr|bpm|pulse|floors?|steps?|spm|rpm|cadence|%)/i,
};

const NUMBER = /(\d+(?:[.,]\d+)?)/;
// A clock ("25:12", "1:02:33") is time, never one of ours.
const CLOCK = /\d+:\d{2}/;

const kindOf = (text: string): ScanField | 'skip' | null => {
  // Speed first: "AVG SPEED MPH" must not read as distance for its "MI"-less unit, and "KM/H" holds "KM".
  if (LABELS.speed.test(text)) return 'speed';
  if (LABELS.calories.test(text)) return 'calories';
  if (LABELS.skip.test(text)) return 'skip';
  if (LABELS.distance.test(text)) return 'distance';
  return null;
};

const numberIn = (text: string): number | null => {
  if (CLOCK.test(text)) return null;
  const m = text.match(NUMBER);
  return m ? Number(m[1].replace(',', '.')) : null;
};

const unitIn = (text: string): DistanceUnit | null => (/\bkm|kilomet|km\/h|kph/i.test(text) ? 'km' : /\bmi(les?)?\b|mph/i.test(text) ? 'mi' : null);

const RANGE: Record<ScanField, [number, number]> = {
  // In the console's own unit.
  distance: [0.01, 100],
  calories: [1, 5000],
  speed: [0.5, 60],
};

const toReading = (field: ScanField, value: number, unit: DistanceUnit): ConsoleReading => {
  const per = unit === 'mi' ? M_PER_MI : 1000;
  switch (field) {
    case 'distance':
      return { distanceM: value * per };
    case 'calories':
      return { kcal: Math.round(value) };
    case 'speed':
      return { speedMps: (value * per) / 3600 };
  }
};

/** How far a number's box sits from a label's, for pairing: below and to the right are both fine, above or left are not. */
const reach = (label: TextPiece, n: TextPiece): number | null => {
  const lx = label.x + label.w / 2;
  const nx = n.x + n.w / 2;
  const below = n.y - (label.y + label.h);
  const right = n.x - (label.x + label.w);
  const sameRow = Math.abs(n.y + n.h / 2 - (label.y + label.h / 2)) < Math.max(label.h, n.h) * 0.6;
  if (sameRow && right >= -0.01) return right;
  // Directly under, within a row or so: a number further down belongs to the next label.
  if (below >= -0.01 && below < Math.max(label.h, n.h) * 3 && Math.abs(nx - lx) < Math.max(label.w, n.w)) return below + Math.abs(nx - lx) * 0.5;
  return null;
};

/** The numbers found in the console's text, by field; `unit` is the user's, for a distance or speed with no unit on screen. */
export const readConsole = (pieces: TextPiece[], unit: DistanceUnit): ConsoleReading => {
  const found: ConsoleReading = {};
  const used = new Set<number>();
  const consoleUnit = pieces.map(p => unitIn(p.text)).find(Boolean) ?? unit;
  const put = (field: ScanField, value: number, unitHere: DistanceUnit | null) => {
    const [lo, hi] = RANGE[field];
    if (value < lo || value > hi) return false;
    if ((field === 'distance' && found.distanceM !== undefined) || (field === 'calories' && found.kcal !== undefined) || (field === 'speed' && found.speedMps !== undefined)) return false;
    Object.assign(found, toReading(field, value, unitHere ?? consoleUnit));
    return true;
  };

  // A label and its number in one piece: "DIST 2.61", "330 CAL", "6.2 MPH".
  pieces.forEach((p, i) => {
    const field = kindOf(p.text);
    const value = numberIn(p.text);
    if (field && field !== 'skip' && value !== null && put(field, value, unitIn(p.text))) used.add(i);
  });

  // A label on its own, paired with the closest free number below or beside it.
  pieces.forEach((label, i) => {
    const field = kindOf(label.text);
    if (!field || used.has(i) || numberIn(label.text) !== null) return;
    let best: { j: number; d: number } | null = null;
    pieces.forEach((n, j) => {
      // A clock is only ever claimed by a label we read past (TIME), so it can't lend its place to a number below.
      const clock = CLOCK.test(n.text);
      if (j === i || used.has(j) || kindOf(n.text) === 'skip' || (clock ? field !== 'skip' : numberIn(n.text) === null)) return;
      if (kindOf(n.text) && kindOf(n.text) !== field) return;
      const d = reach(label, n);
      if (d !== null && (!best || d < best.d)) best = { j, d };
    });
    const pick = best as { j: number; d: number } | null;
    if (!pick) return;
    used.add(pick.j);
    // A skip label still claims its number, so "INCLINE 1.5" never lends 1.5 to anything else.
    const value = numberIn(pieces[pick.j].text);
    if (field !== 'skip' && value !== null) put(field, value, unitIn(pieces[pick.j].text) ?? unitIn(label.text));
  });

  return found;
};

export const hasReading = (r: ConsoleReading): boolean => r.distanceM !== undefined || r.kcal !== undefined || r.speedMps !== undefined;

/** The set with the kept fields of a reading on it; a scanned distance becomes its distance (see ConsoleScan). */
export const applyScan = (set: LoggedSet, reading: ConsoleReading, keep: ScanField[]): LoggedSet => {
  const scan: ConsoleScan = { ...(set.scan ?? {}) };
  let next: LoggedSet = set;
  if (keep.includes('distance') && reading.distanceM !== undefined) {
    if (!scan.prior) scan.prior = { distanceM: set.distanceM, watch: set.distanceSource === 'watch' };
    scan.distanceM = reading.distanceM;
    const { distanceSource: _gone, ...rest } = next;
    next = { ...rest, distanceM: reading.distanceM };
  }
  if (keep.includes('calories') && reading.kcal !== undefined) scan.kcal = reading.kcal;
  if (keep.includes('speed') && reading.speedMps !== undefined) scan.speedMps = reading.speedMps;
  return { ...next, scan };
};

/** A scanned number changed by hand, in the same units the scan stores. */
export const editScanned = (set: LoggedSet, field: ScanField, value: number): LoggedSet => {
  if (!set.scan) return set;
  switch (field) {
    case 'distance':
      return set.scan.distanceM === undefined ? set : { ...set, distanceM: value, scan: { ...set.scan, distanceM: value } };
    case 'calories':
      return set.scan.kcal === undefined ? set : { ...set, scan: { ...set.scan, kcal: Math.round(value) } };
    case 'speed':
      return set.scan.speedMps === undefined ? set : { ...set, scan: { ...set.scan, speedMps: value } };
  }
};

/** One scanned number taken off; a distance puts back the one it replaced. With nothing scanned left, the scan goes. */
export const removeScanned = (set: LoggedSet, field: ScanField): LoggedSet => {
  if (!set.scan) return set;
  const { distanceM, kcal, speedMps, prior } = set.scan;
  let next: LoggedSet = set;
  const scan: ConsoleScan = {};
  if (field === 'distance' && distanceM !== undefined) {
    next = { ...set, distanceM: prior?.distanceM ?? null, ...(prior?.watch ? { distanceSource: 'watch' as const } : {}) };
  } else {
    if (distanceM !== undefined) scan.distanceM = distanceM;
    if (prior) scan.prior = prior;
  }
  if (field !== 'calories' && kcal !== undefined) scan.kcal = kcal;
  if (field !== 'speed' && speedMps !== undefined) scan.speedMps = speedMps;
  const { scan: _old, ...rest } = next;
  return scan.distanceM !== undefined || scan.kcal !== undefined || scan.speedMps !== undefined ? { ...rest, scan } : rest;
};

/** Whether anything scanned is on the set: while it is, the Scan button stays hidden. */
export const hasScan = (set: Pick<LoggedSet, 'scan'>): boolean => !!set.scan && (set.scan.distanceM !== undefined || set.scan.kcal !== undefined || set.scan.speedMps !== undefined);
