import { Equipment, Exercise, ExerciseCategory, Id, MuscleGroup, MeasurementType } from '../models';
import catalogJson from './exercisedb.json';
import legacyJson from './exercises.json';
import legacyExtraJson from './extraExercises.json';
import { canonicalExerciseId, isLegacyExerciseId } from './exerciseIds';

/**
 * Bundled, read-only exercise catalog: the licensed ExerciseDB Pro library
 * (1,394 exercises, built by tools/exercisedb/build.py; animations hosted on
 * Firebase Hosting) and, beside it, the two lists the app shipped before
 * (free-exercise-db and the hand-written extras), alphabetical. An old id in
 * a plan or a session resolves to its twin in the new library (see
 * exerciseIds.ts), or, with no twin, to its old entry, so nothing a lifter
 * logged ever stops answering by name.
 * Custom exercises live in Firestore and are merged in by the repository layer.
 */
const library = (catalogJson as Exercise[]).slice().sort((a, b) => a.name.localeCompare(b.name));

/**
 * The library films a few exercises from extra angles as separate entries ("Barbell Deep Back Squat, Side View"):
 * the same movement three times over in the search (build 19 feedback). Only the plain entry is on offer; the angle
 * copies still answer by id for anyone who already added one.
 */
const CAMERA_ANGLE = /,\s*(side|rear|front)\s+view$/i;
const oldEntries = [...(legacyJson as Exercise[]), ...(legacyExtraJson as Exercise[])] as Exercise[];
const legacy = new Map<string, Exercise>(oldEntries.map(e => [e.id, e]));

/**
 * An old-library exercise picked on purpose (v1 #6b, owner 2026-10-26): its own id, so it stays itself rather than
 * turning into the twin its old id was matched to (the old "Leg Press" is not the "45-Degree Sled Leg Press").
 */
export const LEGACY_PICK = 'legacy:';

/**
 * Both libraries are on offer again (owner, 2026-10-26: the migration matched some exercises wrong, and some had no
 * match at all), the old ones with no label. An old exercise with exactly the name of a new one is left out, as the
 * same thing twice. One without a twin keeps its old id, which still means it; one with a twin is offered under
 * LEGACY_PICK.
 */
const newNames = new Set(library.map(e => e.name.trim().toLowerCase()));
const oldOnOffer = oldEntries
  .filter(e => !newNames.has(e.name.trim().toLowerCase()))
  .map(e => (isLegacyExerciseId(e.id) ? { ...e, id: `${LEGACY_PICK}${e.id}` } : e));

const catalog = [...library.filter(e => !CAMERA_ANGLE.test(e.name)), ...oldOnOffer].sort((a, b) => a.name.localeCompare(b.name));

const byId = new Map<string, Exercise>([...library, ...oldOnOffer].map(e => [e.id, e]));

/** The library on offer: what the picker and the search show. */
export const getCatalogExercises = (): readonly Exercise[] => catalog;

/** An old exercise picked on purpose, even one no longer on offer. */
const legacyPick = (id: string): Exercise | undefined => {
  if (!id.startsWith(LEGACY_PICK)) return undefined;
  const old = legacy.get(id.slice(LEGACY_PICK.length));
  return old && { ...old, id };
};

/** Any id the app has ever stored: the new library's, an old one picked on purpose, an old id's twin in the new library, or the old entry itself. */
export const getCatalogExercise = (id: string): Exercise | undefined => byId.get(id) ?? legacyPick(id) ?? byId.get(canonicalExerciseId(id)) ?? legacy.get(id);

/** An id from the old library, as stored before the new one (with or without a twin), or picked from it since. */
export const isOldLibraryId = (id: string): boolean => legacy.has(id) || id.startsWith(LEGACY_PICK);

/** The old exercise an old id was, before it was matched to its twin: offered back when it is on offer. */
export const originalOldExercise = (id: string): Exercise | undefined => (isLegacyExerciseId(id) ? byId.get(`${LEGACY_PICK}${id}`) : undefined);

/** The name the catalog has for an id now, else the name that was stored with it. */
export const catalogName = (id: string, stored: string): string => getCatalogExercise(id)?.name ?? stored;

export interface CatalogFilter {
  query?: string;
  muscle?: MuscleGroup;
  measurement?: MeasurementType;
  equipment?: Equipment;
  /**
   * Exercise type. When unset, stretches are left out so they don't mix with
   * training movements; pick 'stretching' to see them.
   */
  category?: ExerciseCategory;
}

/**
 * Fold plurals so "shrugs" finds "Shrug", "raises" finds "Raise" and
 * "crunches" finds "Crunch": trailing "es" after a sibilant, else a
 * trailing "s" that isn't part of "ss". Short words are left alone ("abs").
 */
export const stem = (w: string): string => {
  if (w.length <= 3) return w;
  if (/(ss|us|is)$/.test(w)) return w;
  if (/(sh|ch|x|z)es$/.test(w)) return w.slice(0, -2);
  if (/ies$/.test(w)) return `${w.slice(0, -3)}y`;
  if (/s$/.test(w)) return w.slice(0, -1);
  return w;
};

/** Spellings and gym slang folded onto the catalog's own words, after stemming. Applied to names and queries alike. */
const SYNONYMS: Record<string, string> = {
  flye: 'fly',
  calve: 'calf',
  delt: 'shoulder',
  hammie: 'hamstring',
  booty: 'glute',
  core: 'abdominal',
  abs: 'abdominal',
  pec: 'chest',
};

/** Lower-case, singularised, synonym-folded words, with punctuation such as "Sit-Up" or "90/90" split apart. */
const words = (s: string): string[] =>
  s
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean)
    .map(stem)
    .map(w => SYNONYMS[w] ?? w);

interface Indexed {
  exercise: Exercise;
  nameWords: string[];
  /** Muscles, equipment and category, for matching words that aren't in the name. */
  tagWords: string[];
}

/** Shorthand that stands for several words, expanded before matching. Keys are stemmed. */
const ALIASES: Record<string, string[]> = {
  db: ['dumbbell'],
  bb: ['barbell'],
  kb: ['kettlebell'],
  ez: ['e', 'z'],
  rdl: ['romanian', 'deadlift'],
  bss: ['bulgarian', 'split', 'squat'],
  pullup: ['pull', 'up'],
  chinup: ['chin', 'up'],
  pushup: ['push', 'up'],
  situp: ['sit', 'up'],
  deadbug: ['dead', 'bug'],
  // Gym names the licensed library spells its own way.
  skullcrusher: ['skull', 'crusher'],
  bulgarian: ['rear', 'foot', 'elevated'],
  military: ['overhead'],
  ohp: ['overhead', 'press'],
};

// Shorthand may expand to a word that is itself spelled the library's way ("bss" -> "bulgarian" -> "rear foot elevated").
const queryWords = (q: string): string[] => words(q).flatMap(w => ALIASES[w] ?? [w]).flatMap(w => ALIASES[w] ?? [w]).map(stem);

const index: Indexed[] = catalog.map(exercise => ({
  exercise,
  // An alias counts as a name: "air bike" finds the bicycle crunch.
  nameWords: [...new Set([...words(exercise.name), ...(exercise.aliases ?? []).flatMap(words)])],
  tagWords: words([...exercise.primaryMuscles, ...exercise.secondaryMuscles, exercise.equipment ?? '', exercise.category].join(' ')),
}));

/**
 * How well an exercise matches the typed words, lower is better, or null
 * when a word matches nothing. Every word has to match somewhere: as a
 * prefix of a word in the name (best), inside a word in the name, or as a
 * prefix of a muscle, equipment or category word.
 */
const searchRank = (item: Indexed, terms: string[]): number | null => {
  let rank = 0;
  for (const term of terms) {
    if (item.nameWords.some(w => w.startsWith(term))) continue;
    if (item.nameWords.some(w => w.includes(term))) {
      rank += 1;
      continue;
    }
    if (item.tagWords.some(w => w.startsWith(term))) {
      rank += 2;
      continue;
    }
    return null;
  }
  // A name that starts with the whole query beats one that merely contains the words.
  return item.exercise.name.toLowerCase().startsWith(terms.join(' ')) ? rank - 1 : rank;
};

/**
 * Filter the catalog.
 *
 * Search matches every typed word in any order, against the name first and
 * then muscles, equipment and category, so "db press" finds dumbbell presses
 * and "hamstring curl" finds curls tagged with hamstrings. Better name
 * matches sort first. With a muscle selected, exercises that target it as a
 * primary muscle come before the ones that only hit it as a secondary
 * muscle. The catalog's alphabetical order holds within each group.
 */
export const searchCatalog = ({ query, muscle, measurement, equipment, category }: CatalogFilter): Exercise[] => {
  const terms = queryWords(query ?? '');
  const ranked: { exercise: Exercise; rank: number }[] = [];
  for (const item of index) {
    const e = item.exercise;
    if (muscle && !e.primaryMuscles.includes(muscle) && !e.secondaryMuscles.includes(muscle)) continue;
    if (measurement && e.measurement !== measurement) continue;
    if (equipment && e.equipment !== equipment) continue;
    if (category ? e.category !== category : e.category === 'stretching') continue;
    const rank = terms.length ? searchRank(item, terms) : 0;
    if (rank === null) continue;
    ranked.push({ exercise: e, rank: rank * 2 + (muscle && !e.primaryMuscles.includes(muscle) ? 1 : 0) });
  }
  return ranked.sort((a, b) => a.rank - b.rank).map(r => r.exercise);
};

/** Equipment values in the catalog, with display labels, for filters. */
export const EQUIPMENT_OPTIONS: { value: Equipment; label: string }[] = [
  { value: 'body only', label: 'Body only' },
  { value: 'dumbbell', label: 'Dumbbell' },
  { value: 'barbell', label: 'Barbell' },
  { value: 'kettlebells', label: 'Kettlebell' },
  { value: 'cable', label: 'Cable' },
  { value: 'machine', label: 'Machine' },
  { value: 'bands', label: 'Bands' },
  { value: 'e-z curl bar', label: 'EZ curl bar' },
  { value: 'medicine ball', label: 'Medicine ball' },
  { value: 'exercise ball', label: 'Exercise ball' },
  { value: 'foam roll', label: 'Foam roll' },
  { value: 'other', label: 'Other' },
];

/** Exercise types in the catalog, with display labels, for filters. */
export const CATEGORY_OPTIONS: { value: ExerciseCategory; label: string }[] = [
  { value: 'strength', label: 'Strength' },
  { value: 'stretching', label: 'Stretching' },
  { value: 'cardio', label: 'Cardio' },
  { value: 'plyometrics', label: 'Plyometrics' },
  { value: 'powerlifting', label: 'Powerlifting' },
  { value: 'olympic weightlifting', label: 'Olympic lifting' },
  { value: 'strongman', label: 'Strongman' },
];

/** Muscle groups in display order, for filters and the muscle diagram. */
export const MUSCLE_GROUPS: MuscleGroup[] = [
  'chest', 'shoulders', 'triceps', 'biceps', 'forearms', 'lats', 'middle back',
  'lower back', 'traps', 'neck', 'abdominals', 'quadriceps', 'hamstrings',
  'glutes', 'calves', 'adductors', 'abductors',
];

/**
 * Exercises that could stand in for `exercise` mid-workout: the same
 * primary muscles and measurement, closest equipment first (same
 * equipment, then anything), never a stretch. `exclude` drops the ones
 * already in the workout.
 */
export const comparableExercises = (exercise: Exercise, exclude: Set<Id> = new Set(), limit = 12): Exercise[] => {
  const primary = new Set(exercise.primaryMuscles);
  const ranked: { exercise: Exercise; rank: number }[] = [];
  // The library's own curated links lead: substitutions, then the closest similar exercises.
  const linked = [...(exercise.relations?.substitutions ?? []), ...(exercise.relations?.similar ?? [])];
  const seen = new Set<Id>([exercise.id]);
  for (let i = 0; i < linked.length; i++) {
    const e = byId.get(linked[i]);
    if (!e || seen.has(e.id) || exclude.has(e.id) || e.category === 'stretching' || e.measurement !== exercise.measurement) continue;
    seen.add(e.id);
    ranked.push({ exercise: e, rank: -100 + i });
  }
  for (const item of index) {
    const e = item.exercise;
    if (seen.has(e.id) || exclude.has(e.id) || e.category === 'stretching') continue;
    if (e.measurement !== exercise.measurement) continue;
    const shared = e.primaryMuscles.filter(m => primary.has(m)).length;
    if (shared === 0) continue;
    const rank = (e.equipment === exercise.equipment ? 0 : 10) + (primary.size - shared) + (e.primaryMuscles.length - shared) * 0.5;
    ranked.push({ exercise: e, rank });
  }
  return ranked.sort((a, b) => a.rank - b.rank || a.exercise.name.localeCompare(b.exercise.name)).slice(0, limit).map(r => r.exercise);
};
