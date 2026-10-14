import NativeBadgeModels from '../../specs/NativeBadgeModels';
import { AchievementFamilyId } from '../../data/models';

/** Warm the native model cache for these badges, so each opens with no delay. Resolves once they are all cached. Safe to call often. */
export const preloadBadges = async (badges: Array<{ family: AchievementFamilyId; tier: number }>): Promise<void> => {
  if (badges.length === 0 || !NativeBadgeModels) return;
  try {
    await NativeBadgeModels.preload(badges.map(b => `${b.family}:${b.tier}`).join(','));
  } catch (err) {
    console.warn('badge preload failed', err);
  }
};
