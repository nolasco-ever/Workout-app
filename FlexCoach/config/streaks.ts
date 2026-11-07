/**
 * Streak fire (build 20, owner 2026-11-07): the fire beside a streak changes
 * at each of these day counts. No fire below the first; each later one adds a
 * step (filled, a glow, a bigger glow, a ring), designed on the canvas.
 */
export const STREAK_FIRE_DAYS = [2, 10, 25, 50, 100] as const;
