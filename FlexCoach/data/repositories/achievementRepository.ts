import { paths } from '../firebase/paths';
import { AchievementUnlock, Id, PlanUse } from '../models';
import { listDocs, mergeDoc, patchDoc, readDoc, watchDocs, writeDoc, writeDocs, Unsubscribe } from './base';

export const achievementRepository = {
  list: (uid: Id) => listDocs<AchievementUnlock>(paths.achievements(uid)),

  watch: (uid: Id, onChange: (unlocks: AchievementUnlock[]) => void): Unsubscribe =>
    watchDocs<AchievementUnlock>(paths.achievements(uid), onChange),

  has: async (uid: Id, achievementId: Id) => (await readDoc(paths.achievement(uid, achievementId))) !== null,

  /** Idempotent: the document id is the achievement id, so re-unlocking is a no-op. */
  unlock: (uid: Id, unlock: AchievementUnlock) => writeDoc(paths.achievement(uid, unlock.achievementId), unlock),

  unlockMany: (uid: Id, unlocks: AchievementUnlock[]) => writeDocs(unlocks.map(u => ({ path: paths.achievement(uid, u.achievementId), data: u }))),

  /** The celebration was shown for these; they won't be shown again. */
  markCelebrated: async (uid: Id, achievementIds: Id[], now: number = Date.now()): Promise<void> => {
    await Promise.all(achievementIds.map(id => patchDoc<AchievementUnlock>(paths.achievement(uid, id), { celebratedAt: now, updatedAt: now })));
  },

  /** Buddies who copied or synced one of the owner's plans. */
  listPlanUses: (uid: Id) => listDocs<PlanUse>(paths.planUses(uid)),

  /**
   * Note, in the owner's tree, that I copied or synced their plan. Written
   * by the buddy (the rules allow only their own row); the server counts
   * the rows. A second plan adds to the same row.
   */
  recordPlanUse: async (ownerUid: Id, buddyUid: Id, planId: Id, now: number = Date.now()): Promise<void> => {
    const path = paths.planUse(ownerUid, buddyUid);
    const existing = await readDoc<PlanUse>(path);
    if (existing) {
      if (existing.planIds.includes(planId)) return;
      await mergeDoc<PlanUse>(path, { planIds: [...existing.planIds, planId], updatedAt: now });
      return;
    }
    await writeDoc<PlanUse>(path, { id: buddyUid, buddyUid, planIds: [planId], firstAt: now, createdAt: now, updatedAt: now });
  },
};
