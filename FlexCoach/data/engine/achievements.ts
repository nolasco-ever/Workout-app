import { AchievementFamilyId, AchievementUnlock, Cycle, Id, Session, WeightUnit } from '../models';
import { longestStreakDays } from './buddies';
import { cycleCounts } from './schedule';
import { findPersonalRecords, totalVolumeKg } from './stats';
import { kgToLb } from './units';
import { BUDDY_LADDERS } from '../../functions/src/ladders';

/**
 * Badges. Every family is a ladder of tiers; the same badge upgrades as
 * the user climbs it, so a family is one tile in the grid and a tier is
 * one celebration. Ladders only ever grow: append a threshold and the
 * next judge unlocks it for anyone already past it.
 *
 * Judging is a pure function of the user's history (`measureAchievements`
 * then `computeNewUnlocks`), so the same code runs after a workout, when
 * a cycle report is opened, and once as a catch-up on the first launch
 * with badges. The two buddy families are counted by a Cloud Function as
 * well (functions/src/ladders.ts mirrors their ladders) so they unlock
 * while the app is closed.
 */

export type MaterialId = 'bronze' | 'silver' | 'gold' | 'platinum' | 'ruby' | 'sapphire' | 'emerald' | 'diamond';

/** Tier 1 is bronze and the look upgrades from there; a ladder longer than this stays diamond. */
export const MATERIALS: MaterialId[] = ['bronze', 'silver', 'gold', 'platinum', 'ruby', 'sapphire', 'emerald', 'diamond'];

export const materialFor = (tier: number): MaterialId => MATERIALS[Math.min(Math.max(1, tier), MATERIALS.length) - 1];

export interface AchievementFamily {
  id: AchievementFamilyId;
  name: string;
  /** What is counted, for the grid: "workouts finished". */
  counts: string;
  /** Thresholds, lowest first. Volume is in lb here; see `tiersKg`. */
  tiers: number[];
  /** The ladder for kilogram users; volume only. */
  tiersKg?: number[];
  /** Device: after a workout or a report. Server: a Cloud Function, so it unlocks while the app is closed. */
  judgedBy: 'device' | 'server';
}

const plural = (n: number, one: string, many = `${one}s`): string => `${n.toLocaleString()} ${n === 1 ? one : many}`;

/** "10k", "1M": the compact form used on volume badges. */
export const compactCount = (n: number): string => (n >= 1_000_000 ? `${(n / 1_000_000).toLocaleString(undefined, { maximumFractionDigits: 1 })}M` : n >= 1000 ? `${Math.round(n / 1000)}k` : n.toLocaleString());

export const ACHIEVEMENT_FAMILIES: AchievementFamily[] = [
  { id: 'workouts', name: 'Workouts', counts: 'workouts finished, from a plan or on the spot', tiers: [1, 10, 25, 50, 100, 250, 500, 1000], judgedBy: 'device' },
  { id: 'streak', name: 'Streak', counts: 'days in a row with a workout, your longest run', tiers: [7, 14, 30, 60, 100, 180, 365], judgedBy: 'device' },
  { id: 'volume', name: 'Iron moved', counts: 'total weight lifted across every set', tiers: [10_000, 50_000, 100_000, 250_000, 500_000, 1_000_000, 2_500_000], tiersKg: [5_000, 25_000, 50_000, 100_000, 250_000, 500_000, 1_000_000], judgedBy: 'device' },
  { id: 'records', name: 'Records', counts: 'personal bests beaten', tiers: [1, 10, 25, 50, 100, 250], judgedBy: 'device' },
  { id: 'cycles', name: 'Cycles', counts: 'training cycles finished and reviewed', tiers: [1, 5, 10, 25, 50], judgedBy: 'device' },
  { id: 'perfect_cycles', name: 'Perfect cycles', counts: 'cycles with every workout done', tiers: [1, 5, 10, 25], judgedBy: 'device' },
  { id: 'early_bird', name: 'Early bird', counts: 'workouts started before 6am', tiers: [1, 10, 50, 100], judgedBy: 'device' },
  { id: 'night_owl', name: 'Night owl', counts: 'workouts started after 10pm', tiers: [1, 10, 50, 100], judgedBy: 'device' },
  { id: 'buddies', name: 'Buddies', counts: 'buddies on your Iron Card', tiers: [...BUDDY_LADDERS.buddies], judgedBy: 'server' },
  { id: 'plan_uses', name: 'Plans used', counts: 'buddies who copied or synced one of your plans', tiers: [...BUDDY_LADDERS.plan_uses], judgedBy: 'server' },
];

export const familyOf = (id: AchievementFamilyId): AchievementFamily => {
  const family = ACHIEVEMENT_FAMILIES.find(f => f.id === id);
  if (!family) throw new Error(`Unknown achievement family ${id}`);
  return family;
};

export const thresholdsFor = (family: AchievementFamily, unit: WeightUnit): number[] => (family.id === 'volume' && unit === 'kg' ? family.tiersKg! : family.tiers);

export const achievementIdOf = (family: AchievementFamilyId, tier: number): Id => `${family}:${tier}`;

export const parseAchievementId = (id: Id): { family: AchievementFamilyId; tier: number } | null => {
  const [family, tier] = id.split(':');
  const n = Number(tier);
  if (!ACHIEVEMENT_FAMILIES.some(f => f.id === family) || !Number.isInteger(n) || n < 1) return null;
  return { family: family as AchievementFamilyId, tier: n };
};

/** "100 workouts", "30-day streak", "50k lb moved", "5 buddies on your plans". */
export const tierLabel = (family: AchievementFamilyId, threshold: number, unit: WeightUnit): string => {
  switch (family) {
    case 'workouts':
      return plural(threshold, 'workout');
    case 'streak':
      return `${threshold}-day streak`;
    case 'volume':
      return `${compactCount(threshold)} ${unit} moved`;
    case 'records':
      return plural(threshold, 'record');
    case 'cycles':
      return plural(threshold, 'cycle');
    case 'perfect_cycles':
      return plural(threshold, 'perfect cycle');
    case 'early_bird':
      return plural(threshold, 'early workout');
    case 'night_owl':
      return plural(threshold, 'late workout');
    case 'buddies':
      return plural(threshold, 'buddy', 'buddies');
    case 'plan_uses':
      return `${plural(threshold, 'buddy', 'buddies')} on your plans`;
  }
};

export type AchievementValues = Record<AchievementFamilyId, number>;

export interface AchievementInput {
  /** Every session; only completed ones count. */
  sessions: Session[];
  cycles: Cycle[];
  /** Accepted buddies. */
  buddies: number;
  /** Distinct buddies who copied or synced one of the user's plans. */
  planUses: number;
  unit: WeightUnit;
}

const hourOf = (ts: number): number => new Date(ts).getHours();

/** A cycle counts once it has a workout in it and its report was opened (or it was closed before reports existed). */
export const isFinishedCycle = (cycle: Cycle): boolean => cycleCounts(cycle) && (cycle.status === 'completed' || !!cycle.reportReviewedAt);

/** Every workout day of the cycle was done; nothing skipped or pushed out. */
export const isPerfectCycle = (cycle: Cycle): boolean => {
  const workouts = cycle.occurrences.filter(o => o.status !== 'rest');
  return workouts.length > 0 && workouts.every(o => o.status === 'completed');
};

/** Where the user stands on every ladder, in each family's own unit. */
export const measureAchievements = (input: AchievementInput): AchievementValues => {
  const completed = input.sessions.filter(s => s.status === 'completed');
  const finished = input.cycles.filter(isFinishedCycle);
  const volumeKg = totalVolumeKg(completed);
  return {
    workouts: completed.length,
    streak: longestStreakDays(completed),
    volume: input.unit === 'lb' ? kgToLb(volumeKg) : volumeKg,
    // The first lift of an exercise is a baseline, not a record: only improvements count.
    records: findPersonalRecords(completed, []).filter(pr => pr.previousValue !== null).length,
    cycles: finished.length,
    perfect_cycles: finished.filter(isPerfectCycle).length,
    early_bird: completed.filter(s => hourOf(s.startedAt) < 6).length,
    night_owl: completed.filter(s => hourOf(s.startedAt) >= 22).length,
    buddies: input.buddies,
    plan_uses: input.planUses,
  };
};

/** The highest tier `value` reaches on a ladder (0 for none). */
export const tierReached = (family: AchievementFamily, value: number, unit: WeightUnit): number => thresholdsFor(family, unit).filter(t => value >= t).length;

export interface FamilyProgress {
  family: AchievementFamily;
  value: number;
  /** Highest tier unlocked (0 for none). */
  tier: number;
  /** The next threshold, or null at the top of the ladder. */
  next: number | null;
  /** 0..1 of the way from the last threshold to the next; 1 at the top. */
  fraction: number;
}

/** Progress on one ladder, for the grid tile and the detail sheet. Counts stored unlocks too, so a tier earned on a ladder that later changed stays. */
export const progressFor = (family: AchievementFamily, value: number, unit: WeightUnit, unlocked: Pick<AchievementUnlock, 'family' | 'tier'>[] = []): FamilyProgress => {
  const thresholds = thresholdsFor(family, unit);
  const stored = Math.max(0, ...unlocked.filter(u => u.family === family.id).map(u => u.tier));
  const tier = Math.max(tierReached(family, value, unit), stored);
  const next = thresholds[tier] ?? null;
  const previous = tier > 0 ? thresholds[tier - 1] ?? 0 : 0;
  const fraction = next === null ? 1 : Math.max(0, Math.min(1, (value - previous) / (next - previous)));
  return { family, value, tier, next, fraction };
};

/**
 * Every tier reached but not yet stored, as unlock documents ready to
 * write. `families` narrows the judging (the device leaves the server's
 * families alone outside the one-time catch-up).
 */
export const computeNewUnlocks = (
  values: AchievementValues,
  existing: Pick<AchievementUnlock, 'achievementId'>[],
  unit: WeightUnit,
  source: AchievementUnlock['source'],
  now: number,
  families: AchievementFamily[] = ACHIEVEMENT_FAMILIES,
  context: AchievementUnlock['context'] = {},
): AchievementUnlock[] => {
  const have = new Set(existing.map(u => u.achievementId));
  const out: AchievementUnlock[] = [];
  for (const family of families) {
    const thresholds = thresholdsFor(family, unit);
    const value = values[family.id];
    thresholds.forEach((threshold, i) => {
      const tier = i + 1;
      const achievementId = achievementIdOf(family.id, tier);
      if (value < threshold || have.has(achievementId)) return;
      out.push({ id: achievementId, achievementId, family: family.id, tier, threshold, value, unlockedAt: now, source, celebratedAt: null, context, createdAt: now, updatedAt: now });
    });
  }
  // Family order, lowest tier first, so a catch-up celebrates bronze before gold.
  return out;
};

/** Copy for the feed item and push a tier produces. */
export const unlockCopy = (unlock: Pick<AchievementUnlock, 'family' | 'tier' | 'threshold'>, unit: WeightUnit): { title: string; body: string } => {
  const family = familyOf(unlock.family);
  const label = tierLabel(unlock.family, unlock.threshold, unit);
  const material = materialFor(unlock.tier);
  return {
    title: `Badge unlocked: ${label} 🏅`,
    body: unlock.tier === 1 ? `Your ${family.name} badge is yours. Tap to see it` : `Your ${family.name} badge is now ${material}. Tap to see it`,
  };
};

/** What buddies are told. */
export const buddyUnlockCopy = (firstName: string, unlock: Pick<AchievementUnlock, 'family' | 'tier' | 'threshold'>, unit: WeightUnit): { title: string; body: string } => {
  const label = tierLabel(unlock.family, unlock.threshold, unit);
  return { title: `${firstName} unlocked a badge 🏅`, body: `${label}. Tap to see their card` };
};
