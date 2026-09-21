import { Exercise, MuscleGroup, MeasurementType } from '../models';
import catalogJson from './exercises.json';

/**
 * Bundled, read-only exercise catalog seeded from the public-domain
 * free-exercise-db project (https://github.com/yuhonas/free-exercise-db).
 * Custom exercises live in Firestore and are merged in by the repository layer.
 */
const catalog = catalogJson as Exercise[];

const byId = new Map<string, Exercise>(catalog.map(e => [e.id, e]));

export const getCatalogExercises = (): readonly Exercise[] => catalog;

export const getCatalogExercise = (id: string): Exercise | undefined => byId.get(id);

export interface CatalogFilter {
  query?: string;
  muscle?: MuscleGroup;
  measurement?: MeasurementType;
  equipment?: string;
}

export const searchCatalog = ({ query, muscle, measurement, equipment }: CatalogFilter): Exercise[] => {
  const q = query?.trim().toLowerCase();
  return catalog.filter(e => {
    if (q && !e.name.toLowerCase().includes(q)) return false;
    if (muscle && !e.primaryMuscles.includes(muscle) && !e.secondaryMuscles.includes(muscle)) return false;
    if (measurement && e.measurement !== measurement) return false;
    if (equipment && e.equipment !== equipment) return false;
    return true;
  });
};

/** Muscle groups in display order, for filters and the muscle diagram. */
export const MUSCLE_GROUPS: MuscleGroup[] = [
  'chest', 'shoulders', 'triceps', 'biceps', 'forearms', 'lats', 'middle back',
  'lower back', 'traps', 'neck', 'abdominals', 'quadriceps', 'hamstrings',
  'glutes', 'calves', 'adductors', 'abductors',
];
