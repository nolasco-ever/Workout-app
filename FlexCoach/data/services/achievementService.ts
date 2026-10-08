import { AchievementUnlock, Id, PlanUse, UserProfile } from '../models';
import { ACHIEVEMENT_FAMILIES, computeNewUnlocks, measureAchievements, unlockCopy } from '../engine/achievements';
import { achievementRepository } from '../repositories/achievementRepository';
import { buddyRepository } from '../repositories/buddyRepository';
import { cycleRepository } from '../repositories/cycleRepository';
import { notificationRepository } from '../repositories/notificationRepository';
import { sessionRepository } from '../repositories/sessionRepository';
import { userRepository } from '../repositories/userRepository';
import { afterAchievementsUnlocked } from './buddyService';

/**
 * Badges, judged on the device. Runs after a workout, when a cycle report
 * is opened, and once on the first launch with badges (the catch-up,
 * which grants everything already earned without telling buddies). The
 * two buddy families are the server's outside the catch-up; see
 * functions/src/index.ts.
 *
 * Writes the unlock documents, a feed item per tier for the owner, and,
 * outside the catch-up, an activity line and a push to every buddy. The
 * celebration itself is shown by AchievementCelebration, which watches
 * for unlocks without a `celebratedAt`.
 */
export const judgeAchievements = async (uid: Id, profileHint: UserProfile | null, context: AchievementUnlock['context'] = {}): Promise<AchievementUnlock[]> => {
  const profile = profileHint ?? (await userRepository.get(uid));
  const unit = profile?.weightUnit ?? 'lb';
  const catchUp = !profile?.achievementsBackfilledAt;
  const [sessions, cycles, existing, buddies, planUses] = await Promise.all([
    sessionRepository.listAll(uid),
    cycleRepository.listAll(uid),
    achievementRepository.list(uid),
    buddyRepository.list(uid),
    achievementRepository.listPlanUses(uid).catch((): PlanUse[] => []),
  ]);
  const values = measureAchievements({ sessions, cycles, buddies: buddies.filter(b => b.status === 'accepted').length, planUses: planUses.length, unit });
  const families = catchUp ? ACHIEVEMENT_FAMILIES : ACHIEVEMENT_FAMILIES.filter(f => f.judgedBy === 'device');
  const now = Date.now();
  const fresh = computeNewUnlocks(values, existing, unit, catchUp ? 'backfill' : 'device', now, families, context);

  if (fresh.length > 0) {
    await achievementRepository.unlockMany(uid, fresh);
    // The owner's own feed line per tier. No push: they are in the app, and the celebration is about to show.
    for (const unlock of fresh) {
      const { title, body } = unlockCopy(unlock, unit);
      await notificationRepository.ensure(uid, { id: `achievement:${unlock.achievementId}`, kind: 'achievement', title, body, target: { screen: 'achievement', achievementId: unlock.achievementId }, push: false }).catch(() => undefined);
    }
    await afterAchievementsUnlocked(uid, profile, fresh, unit, catchUp).catch(err => console.warn('achievement buddy update failed', err));
  }
  if (catchUp) await userRepository.update(uid, { achievementsBackfilledAt: now });
  return fresh;
};

/** Stamp the celebration as seen. */
export const markAchievementsCelebrated = (uid: Id, achievementIds: Id[]): Promise<void> => achievementRepository.markCelebrated(uid, achievementIds);
