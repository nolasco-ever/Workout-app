import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../auth/AuthProvider';
import { AchievementUnlock, WeightUnit } from '../models';
import { ACHIEVEMENT_FAMILIES, AchievementValues, FamilyProgress, measureAchievements, progressFor } from '../engine/achievements';
import { achievementRepository } from '../repositories/achievementRepository';
import { buddyRepository } from '../repositories/buddyRepository';
import { cycleRepository } from '../repositories/cycleRepository';
import { sessionRepository } from '../repositories/sessionRepository';

export interface AchievementsState {
  loading: boolean;
  unlocks: AchievementUnlock[];
  /** Every family, in catalog order, with where the user stands on it. */
  progress: FamilyProgress[];
  /** Families with at least one tier. */
  earned: number;
  unit: WeightUnit;
}

/**
 * The signed-in user's badges: stored unlocks, live, plus where they stand
 * on every ladder. Measuring reads the whole history, so screens that only
 * need counts pass `measure: false`.
 */
export const useAchievements = (measure = true): AchievementsState => {
  const { uid, profile } = useAuth();
  const unit = profile?.weightUnit ?? 'lb';
  const [unlocks, setUnlocks] = useState<AchievementUnlock[] | null>(null);
  const [values, setValues] = useState<AchievementValues | null>(null);

  useEffect(() => {
    if (!uid) {
      setUnlocks([]);
      return;
    }
    return achievementRepository.watch(uid, setUnlocks);
  }, [uid]);

  const unlockCount = unlocks?.length ?? 0;
  useEffect(() => {
    if (!uid || !measure) return;
    let live = true;
    Promise.all([sessionRepository.listAll(uid), cycleRepository.listAll(uid), buddyRepository.list(uid), achievementRepository.listPlanUses(uid).catch(() => [])])
      .then(([sessions, cycles, buddies, planUses]) => {
        if (live) setValues(measureAchievements({ sessions, cycles, buddies: buddies.filter(b => b.status === 'accepted').length, planUses: planUses.length, unit }));
      })
      .catch(err => console.warn('achievement measure failed', err));
    return () => {
      live = false;
    };
    // A new unlock is the one thing that moves the numbers between visits.
  }, [uid, measure, unit, unlockCount]);

  return useMemo(() => {
    const stored = unlocks ?? [];
    const progress = ACHIEVEMENT_FAMILIES.map(f => progressFor(f, values?.[f.id] ?? 0, unit, stored));
    return {
      loading: unlocks === null || (measure && values === null),
      unlocks: stored,
      progress,
      earned: progress.filter(p => p.tier > 0).length,
      unit,
    };
  }, [unlocks, values, unit, measure]);
};
