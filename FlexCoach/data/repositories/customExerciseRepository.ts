import { paths } from '../firebase/paths';
import { CustomExercise, Exercise, Id } from '../models';
import { getCatalogExercise, getCatalogExercises } from '../catalog/exerciseCatalog';
import { listDocs, patchDoc, readDoc, touch, watchDocs, writeDoc, Unsubscribe } from './base';

export const customExerciseRepository = {
  list: (uid: Id) => listDocs<CustomExercise>(paths.customExercises(uid)),

  watch: (uid: Id, onChange: (exercises: CustomExercise[]) => void): Unsubscribe =>
    watchDocs<CustomExercise>(paths.customExercises(uid), onChange),

  save: (uid: Id, exercise: CustomExercise) => writeDoc(paths.customExercise(uid, exercise.id), touch(exercise)),

  archive: (uid: Id, exerciseId: Id) =>
    patchDoc<CustomExercise>(paths.customExercise(uid, exerciseId), { archivedAt: Date.now(), updatedAt: Date.now() }),

  /** Resolve any exercise id, catalog or custom. */
  resolve: async (uid: Id, exerciseId: Id): Promise<Exercise | null> =>
    getCatalogExercise(exerciseId) ?? (await readDoc<CustomExercise>(paths.customExercise(uid, exerciseId))),

  /** Catalog plus the user's non-archived custom exercises. */
  allForUser: async (uid: Id): Promise<Exercise[]> => {
    const custom = await listDocs<CustomExercise>(paths.customExercises(uid));
    return [...getCatalogExercises(), ...custom.filter(e => e.archivedAt === null)];
  },
};
