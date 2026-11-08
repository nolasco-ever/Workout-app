import { DistanceUnit } from '../models';
import { CardioActivity, CardioKind, cardioKind } from '../liveActivity/cardioKind';
import { M_PER_MI } from './units';

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
