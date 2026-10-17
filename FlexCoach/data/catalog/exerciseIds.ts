import legacyMap from './legacyExerciseMap.json';

/**
 * Exercise ids across the two libraries the app has shipped. Plans, sessions
 * and records written before the licensed library still carry the old ids;
 * each one that has a twin in the new library resolves to it here, so a
 * lifter's history and the picker's exercise are one and the same. An old id
 * with no twin stays itself (its legacy entry still answers by name).
 * Pure, so the engines can group by exercise without the catalog.
 */
const LEGACY: Record<string, string> = legacyMap as Record<string, string>;

export const canonicalExerciseId = (id: string): string => LEGACY[id] ?? id;

/** The same exercise, whichever library each id came from. */
export const sameExercise = (a: string, b: string): boolean => a === b || canonicalExerciseId(a) === canonicalExerciseId(b);

/** True for an id from the old library that now resolves elsewhere. */
export const isLegacyExerciseId = (id: string): boolean => id in LEGACY;
