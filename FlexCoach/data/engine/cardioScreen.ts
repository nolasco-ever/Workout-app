import { DistanceUnit, LoggedSet, WatchMetrics } from '../models';
import { CardioActivity, CardioKind, cardioKind } from '../liveActivity/cardioKind';
import { formatDistance, formatDuration, M_PER_MI } from './units';

/**
 * What the cardio screen shows for an exercise (v1 #10.6, the "Cardio kinds"
 * board): only what a Watch measures, plus time. Distance and pace (speed on
 * a ride) where the Watch measures distance, distance on a swim, heart rate
 * and calories on every kind. Outdoor kinds put the map behind the panel
 * (10.8); the rest show the kind's icon in rings. Machines can have their
 * console scanned on the done screen (10.7).
 */
export type CardioStat = 'distance' | 'pace' | 'speed' | 'heartRate' | 'calories';

/** The kind's glyph, by name; the screen picks the icon. */
export type CardioGlyph = 'run' | 'walk' | 'bike' | 'elliptical' | 'stairs' | 'rower' | 'ski' | 'swim' | 'cardio';

export interface CardioScreenKind {
  stats: CardioStat[];
  behind: 'map' | 'graphic';
  glyph: CardioGlyph;
  scan: boolean;
}

const GLYPH: Record<CardioActivity, CardioGlyph> = {
  running: 'run',
  walking: 'walk',
  cycling: 'bike',
  handCycling: 'bike',
  elliptical: 'elliptical',
  stairClimbing: 'stairs',
  rowing: 'rower',
  crossCountrySkiing: 'ski',
  swimming: 'swim',
  jumpRope: 'cardio',
  mixedCardio: 'cardio',
};

/** Machines with a console to read; jump rope and general cardio have none. */
const MACHINE: CardioActivity[] = ['running', 'walking', 'cycling', 'handCycling', 'elliptical', 'stairClimbing', 'rowing', 'crossCountrySkiing'];

export const screenKindOf = (kind: CardioKind): CardioScreenKind => {
  const ride = kind.activity === 'cycling';
  const stats: CardioStat[] =
    kind.activity === 'swimming' ? ['distance'] : kind.distance ? ['distance', ride ? 'speed' : 'pace'] : [];
  return {
    stats: [...stats, 'heartRate', 'calories'],
    behind: kind.outdoor ? 'map' : 'graphic',
    glyph: GLYPH[kind.activity],
    scan: !kind.outdoor && MACHINE.includes(kind.activity),
  };
};

export const cardioScreenKind = (exerciseId: string): CardioScreenKind => screenKindOf(cardioKind(exerciseId));

const perUnit = (unit: DistanceUnit) => (unit === 'mi' ? M_PER_MI : 1000);

/** Seconds per mile or km, once there is enough distance for it to mean anything (10 m); null before. */
export const paceSecPer = (distanceM: number | null, elapsedSec: number, unit: DistanceUnit): number | null =>
  distanceM && distanceM >= 10 && elapsedSec > 0 ? elapsedSec / (distanceM / perUnit(unit)) : null;

/** Miles or km an hour; null without distance. */
export const speedPerHour = (distanceM: number | null, elapsedSec: number, unit: DistanceUnit): number | null =>
  distanceM && distanceM >= 10 && elapsedSec > 0 ? distanceM / perUnit(unit) / (elapsedSec / 3600) : null;

export interface DoneRow {
  key: CardioStat;
  label: string;
  value: string;
  /** Set when the number came from a console scan: it can be edited or removed. */
  scanned?: 'distance' | 'calories' | 'speed';
}

/**
 * The table on the cardio done screen (v1 #10.7, the "Cardio · done" boards):
 * the kind's stats with what was measured, scanned numbers in place of the
 * Watch's, and a scanned average speed even where the kind shows pace. A row
 * with nothing to show is left out.
 */
export const cardioDoneRows = (kind: CardioScreenKind, set: Pick<LoggedSet, 'distanceM' | 'durationSec' | 'scan'>, watch: WatchMetrics | null | undefined, unit: DistanceUnit): DoneRow[] => {
  const rows: DoneRow[] = [];
  const sec = set.durationSec ?? 0;
  const scan = set.scan;
  const speedLabel = unit === 'mi' ? 'mph' : 'km/h';
  const speedRow = (): DoneRow | null => {
    if (scan?.speedMps !== undefined) return { key: 'speed', label: 'Avg speed', value: `${(scan.speedMps * 3600 / (unit === 'mi' ? M_PER_MI : 1000)).toFixed(1)} ${speedLabel}`, scanned: 'speed' };
    const v = speedPerHour(set.distanceM, sec, unit);
    return v === null ? null : { key: 'speed', label: 'Avg speed', value: `${v.toFixed(1)} ${speedLabel}` };
  };
  const stats = kind.stats.includes('speed') || scan?.speedMps === undefined ? kind.stats : [...kind.stats, 'speed' as const];
  for (const stat of stats) {
    switch (stat) {
      case 'distance':
        if (set.distanceM) rows.push({ key: stat, label: 'Distance', value: formatDistance(set.distanceM, unit), ...(scan?.distanceM !== undefined ? { scanned: 'distance' as const } : {}) });
        break;
      case 'pace': {
        const p = paceSecPer(set.distanceM, sec, unit);
        if (p !== null) rows.push({ key: stat, label: 'Pace', value: `${formatDuration(p)} per ${unit}` });
        break;
      }
      case 'speed': {
        const r = speedRow();
        if (r) rows.push(r);
        break;
      }
      case 'heartRate':
        if (watch?.avgBpm) rows.push({ key: stat, label: 'Avg heart rate', value: `${watch.avgBpm} bpm` });
        break;
      case 'calories':
        if (scan?.kcal !== undefined) rows.push({ key: stat, label: 'Calories', value: `${scan.kcal} kcal`, scanned: 'calories' });
        else if (watch?.kcal) rows.push({ key: stat, label: 'Calories', value: `${watch.kcal} kcal` });
        break;
    }
  }
  return rows;
};
