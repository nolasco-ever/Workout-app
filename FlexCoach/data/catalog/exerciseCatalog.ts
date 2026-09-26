import { Equipment, Exercise, ExerciseCategory, MuscleGroup, MeasurementType } from '../models';
import catalogJson from './exercises.json';
import extraJson from './extraExercises.json';

/**
 * Bundled, read-only exercise catalog seeded from the public-domain
 * free-exercise-db project (https://github.com/yuhonas/free-exercise-db),
 * plus a hand-written supplement of common gym movements that project lacks
 * (extraExercises.json; no photos yet). Kept in one alphabetical list.
 * Custom exercises live in Firestore and are merged in by the repository layer.
 */
const catalog = ([...(catalogJson as Exercise[]), ...(extraJson as Exercise[])] as Exercise[]).sort((a, b) => a.name.localeCompare(b.name));

const byId = new Map<string, Exercise>(catalog.map(e => [e.id, e]));

export const getCatalogExercises = (): readonly Exercise[] => catalog;

export const getCatalogExercise = (id: string): Exercise | undefined => byId.get(id);

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
  ohp: ['overhead', 'press'],
  rdl: ['romanian', 'deadlift'],
  bss: ['bulgarian', 'split', 'squat'],
  pullup: ['pull', 'up'],
  chinup: ['chin', 'up'],
  pushup: ['push', 'up'],
  situp: ['sit', 'up'],
  deadbug: ['dead', 'bug'],
  skullcrusher: ['skull', 'crusher'],
};

const queryWords = (q: string): string[] => words(q).flatMap(w => ALIASES[w] ?? [w]);

const index: Indexed[] = catalog.map(exercise => ({
  exercise,
  nameWords: words(exercise.name),
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
