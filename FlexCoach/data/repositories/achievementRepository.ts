import { paths } from '../firebase/paths';
import { AchievementUnlock, Id } from '../models';
import { listDocs, readDoc, watchDocs, writeDoc, Unsubscribe } from './base';

export const achievementRepository = {
  list: (uid: Id) => listDocs<AchievementUnlock>(paths.achievements(uid)),

  watch: (uid: Id, onChange: (unlocks: AchievementUnlock[]) => void): Unsubscribe =>
    watchDocs<AchievementUnlock>(paths.achievements(uid), onChange),

  has: async (uid: Id, achievementId: Id) => (await readDoc(paths.achievement(uid, achievementId))) !== null,

  /** Idempotent: the document id is the achievement id, so re-unlocking is a no-op. */
  unlock: (uid: Id, unlock: AchievementUnlock) => writeDoc(paths.achievement(uid, unlock.achievementId), unlock),
};
