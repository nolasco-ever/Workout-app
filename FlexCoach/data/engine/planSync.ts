import { Plan } from '../models';

/**
 * A synced copy follows the buddy's plan. Only the plan's substance moves
 * across: name, description, goal, workouts and schedule. Everything about
 * the copy's life on this account (id, owner, status, archive state, its
 * own visibility, when it was shared) stays put.
 */

export const isSynced = (plan: Plan): boolean => !!plan.sharedFrom?.synced;

/** Why syncing has to stop, or null while the source is still fit to follow. */
export const syncEndReason = (source: Plan | null): 'deleted' | 'unshared' | 'archived' | null => {
  if (!source) return 'deleted';
  if (!source.visibleToBuddies) return 'unshared';
  if (source.status === 'archived') return 'archived';
  return null;
};

/** True when the source has something the copy doesn't have yet. */
export const sourceIsNewer = (mine: Plan, source: Plan): boolean => (mine.sharedFrom?.sourceUpdatedAt ?? 0) < source.updatedAt;

/** The copy with the source's current substance applied. */
export const applySource = (mine: Plan, source: Plan): Plan => ({
  ...mine,
  name: source.name,
  description: source.description,
  goal: source.goal,
  workouts: source.workouts,
  schedule: source.schedule,
  sharedFrom: mine.sharedFrom ? { ...mine.sharedFrom, sourceUpdatedAt: source.updatedAt } : mine.sharedFrom,
});

/** Whether applying the source would change what the user sees or trains. */
export const substanceDiffers = (mine: Plan, source: Plan): boolean =>
  mine.name !== source.name ||
  (mine.description ?? null) !== (source.description ?? null) ||
  (mine.goal ?? null) !== (source.goal ?? null) ||
  JSON.stringify(mine.workouts) !== JSON.stringify(source.workouts) ||
  JSON.stringify(mine.schedule) !== JSON.stringify(source.schedule);

/** The copy cut loose from its source: a plain copy from here on. */
export const detachFromSource = (mine: Plan): Plan =>
  mine.sharedFrom ? { ...mine, sharedFrom: { ...mine.sharedFrom, synced: false } } : mine;
