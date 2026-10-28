import { Exercise, Id, Plan, UserProfile } from '../models';
import { paths } from '../firebase/paths';
import { touch, writeDocs } from '../repositories/base';
import { sessionRepository } from '../repositories/sessionRepository';
import { planRepository } from '../repositories/planRepository';
import { userRepository } from '../repositories/userRepository';
import { applySwap, undoSwap } from '../engine/legacySwap';
import { newId } from '../engine/ids';

/** A workout is going: its exercises can't change under it. */
export class WorkoutInProgressError extends Error {}

/**
 * Legacy Swap (v1 #6b): carries an exercise's history over to the one the
 * lifter picked, everywhere it was logged, and, when asked, replaces it in
 * the active plan. The swap is kept on the profile so it can be undone.
 */
export const performLegacySwap = async (args: {
  uid: Id;
  profile: UserProfile | null;
  key: Id;
  from: { id: Id; name: string };
  to: Exercise;
  activePlan: Plan | null;
  replaceInPlan: boolean;
}): Promise<void> => {
  const { uid, profile, key, from, to, activePlan, replaceInPlan } = args;
  const all = await sessionRepository.listAll(uid);
  if (all.some(s => s.status === 'in_progress')) throw new WorkoutInProgressError('Finish or leave the workout first');
  const now = Date.now();
  const { sessions, plan, swap } = applySwap({ history: all, key, from, to, activePlan, replaceInPlan, id: newId(), now });
  // The record first: if the rest fails partway, Undo can still put back whatever did change.
  await userRepository.update(uid, { legacySwaps: [...(profile?.legacySwaps ?? []), swap] });
  await writeDocs(sessions.map(s => ({ path: paths.session(uid, s.id), data: touch(s, now) })));
  if (plan) await planRepository.save(uid, plan);
};

/** Puts a swap's history, and the plan if it changed, back the way they were. */
export const undoLegacySwap = async (uid: Id, profile: UserProfile | null, swapId: Id): Promise<void> => {
  const swap = profile?.legacySwaps?.find(s => s.id === swapId);
  if (!swap) return;
  const [all, plans] = await Promise.all([sessionRepository.listAll(uid), planRepository.list(uid)]);
  if (all.some(s => s.status === 'in_progress')) throw new WorkoutInProgressError('Finish or leave the workout first');
  const now = Date.now();
  const { sessions, plan } = undoSwap(swap, all, plans);
  await writeDocs(sessions.map(s => ({ path: paths.session(uid, s.id), data: touch(s, now) })));
  if (plan) await planRepository.save(uid, plan);
  await userRepository.update(uid, { legacySwaps: (profile?.legacySwaps ?? []).filter(s => s.id !== swapId) });
};
