/**
 * Tier ladders for the badge families judged on the server, so they can
 * unlock while the app is closed. The app's catalog (data/engine/
 * achievements.ts) imports this file, so the two never drift. Append to
 * grow a ladder; never reorder.
 */
export const BUDDY_LADDERS = {
  /** Accepted buddies. */
  buddies: [1, 5, 10, 25],
  /** Distinct buddies who copied or synced one of the owner's plans. */
  plan_uses: [1, 5, 10, 25, 50],
} as const;

export type ServerFamily = keyof typeof BUDDY_LADDERS;

export const serverAchievementId = (family: ServerFamily, tier: number): string => `${family}:${tier}`;

/** Every tier `value` reaches on the ladder, lowest first. */
export const tiersReached = (family: ServerFamily, value: number): { tier: number; threshold: number }[] =>
  BUDDY_LADDERS[family].map((threshold, i) => ({ tier: i + 1, threshold })).filter(t => value >= t.threshold);
