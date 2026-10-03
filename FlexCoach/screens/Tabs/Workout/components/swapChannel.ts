import { Exercise } from '../../../../data/models';

/**
 * Hands the exercise picked on the swap screen back to the session screen
 * without putting a function in the navigation params.
 */
type Listener = (sessionExerciseId: string, exercise: Exercise) => void;
const listeners = new Set<Listener>();

export const pickSwap = (sessionExerciseId: string, exercise: Exercise): void => {
  listeners.forEach(l => l(sessionExerciseId, exercise));
};

export const subscribeSwap = (listener: Listener): (() => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

/** Same idea for the add-exercise mode of the picker: the pick joins the session. */
type AddListener = (exercise: Exercise) => void;
const addListeners = new Set<AddListener>();

export const pickAdd = (exercise: Exercise): void => {
  addListeners.forEach(l => l(exercise));
};

export const subscribeAdd = (listener: AddListener): (() => void) => {
  addListeners.add(listener);
  return () => {
    addListeners.delete(listener);
  };
};
