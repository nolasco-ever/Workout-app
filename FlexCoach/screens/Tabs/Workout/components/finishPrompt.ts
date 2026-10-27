import { Session, SessionExercise } from '../../../../data/models';
import { isCardio } from '../../../../data/engine/stats';

/** "Running", "Running and Rowing", "Running, Rowing and Bike". */
const listed = (items: string[]): string => (items.length <= 1 ? items.join('') : `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`);

const isDone = (ex: SessionExercise) => ex.sets.length > 0 && ex.sets.every(s => s.completed);

/**
 * What Finish asks before the workout ends. Lifting counts in sets; cardio is
 * not a set, so each cardio exercise is named instead (owner, 2026-10-25):
 * "12 of 15 sets and Running logged. 3 sets stay unlogged."
 */
export const finishPrompt = (session: Session): { title: string; message: string } | { nothing: string } => {
  const lifting = session.exercises.filter(ex => !isCardio(ex));
  const cardio = session.exercises.filter(isCardio);
  const total = lifting.reduce((n, ex) => n + ex.sets.length, 0);
  const done = lifting.reduce((n, ex) => n + ex.sets.filter(s => s.completed).length, 0);
  const cardioDone = cardio.filter(ex => ex.sets.some(s => s.completed)).map(ex => ex.exerciseName);
  const cardioOpen = cardio.filter(ex => !isDone(ex)).map(ex => ex.exerciseName);
  if (done === 0 && cardioDone.length === 0) {
    return { nothing: lifting.length === 0 && cardio.length > 0 ? `Log ${listed(cardio.map(ex => ex.exerciseName))} before finishing.` : 'Mark at least one set done before finishing.' };
  }
  const openSets = total - done;
  const logged = listed([...(done > 0 ? [done === total ? `All ${total} sets` : `${done} of ${total} sets`] : []), ...cardioDone]);
  const open = [...(openSets > 0 ? [`${openSets} set${openSets === 1 ? '' : 's'}`] : []), ...cardioOpen];
  if (open.length === 0) return { title: 'Finish workout?', message: `${logged} logged. Nice work.` };
  const one = open.length === 1 && openSets <= 1;
  return { title: 'Finish early?', message: `${logged} logged. ${listed(open)} ${one ? 'stays' : 'stay'} unlogged.` };
};

/** The warning before a swap or a removal drops what was logged: sets for lifting, the entry itself for cardio. */
export const droppedLine = (ex: SessionExercise, swapped: boolean): string => {
  if (isCardio(ex)) return `What you logged for ${ex.exerciseName} will be dropped.`;
  const logged = ex.sets.filter(s => s.completed).length;
  return `The ${logged} set${logged === 1 ? '' : 's'} you logged for ${swapped ? ex.exerciseName : 'it'} will be dropped.`;
};
