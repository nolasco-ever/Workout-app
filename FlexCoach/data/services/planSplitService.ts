import { Id, UserProfile, WorkoutExercise } from '../models';
import { getCatalogExercise } from '../catalog/exerciseCatalog';
import { exerciseKind } from '../catalog/exerciseKinds';
import { newId } from '../engine/ids';
import { splitPlan } from '../engine/planSplit';
import { planRepository } from '../repositories/planRepository';
import { cycleRepository } from '../repositories/cycleRepository';
import { sessionRepository } from '../repositories/sessionRepository';
import { saveActivePlan, savePlan } from './planService';

/** An entry's kind from the catalog; an exercise the catalog doesn't have (a custom one) stays with strength. */
const kindOf = (e: WorkoutExercise) => {
  const ex = getCatalogExercise(e.exerciseId);
  return ex ? exerciseKind(ex) : 'strength';
};

let running = false;

/**
 * Splits each of the account's plans once (v1 #10.11; no switch, owner
 * 2026-11-07). Never while a workout is going: it waits for the next time
 * the app opens. Plans synced from a buddy are left to follow their source.
 * The plan as it was is kept on it as a backup. An active plan's cycle is
 * laid out again from today the same way an edit does, so past and settled
 * days stay as they are; history is untouched.
 */
export const runPlanSplits = async (uid: Id, profile: UserProfile): Promise<void> => {
  if (running) return;
  running = true;
  try {
    if ((await sessionRepository.listInProgress(uid)).length > 0) return;
    const plans = await planRepository.list(uid);
    for (const plan of plans) {
      if (plan.split || plan.sharedFrom?.synced) continue;
      try {
        const { plan: next, moves } = splitPlan(plan, kindOf, newId);
        const at = Date.now();
        if (next === plan) {
          await planRepository.markSplit(uid, plan.id, { at, moves: [] });
          continue;
        }
        const marked = { ...next, split: { at, moves, backup: JSON.stringify(plan) } };
        const activeCycle = plan.status === 'active' && profile.activePlanId === plan.id && profile.activeCycleId ? await cycleRepository.get(uid, profile.activeCycleId) : null;
        if (plan.status === 'active') await saveActivePlan(uid, plan, marked, activeCycle);
        else await savePlan(uid, marked);
      } catch (err) {
        console.warn('plan split failed for', plan.id, err);
      }
    }
  } finally {
    running = false;
  }
};
