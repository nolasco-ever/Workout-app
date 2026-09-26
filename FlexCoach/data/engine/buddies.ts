import { AchievementUnlock, BestRecord, Id, LocalDate, Plan, PublicProfile, Session, UserProfile } from '../models';
import { addDays } from './dates';
import { computeRecords, currentStreakDays, totalVolumeKg } from './stats';
import { workingSets } from './sets';

/**
 * Everything about buddies that is pure computation: the Iron Card built
 * from a person's history, invite codes, and streak milestones.
 */

/** Longest run of consecutive training days anywhere in the history. */
export const longestStreakDays = (sessions: Session[]): number => {
  const days = [...new Set(sessions.filter(s => s.status === 'completed').map(s => s.date))].sort();
  let best = 0;
  let run = 0;
  let prev: LocalDate | null = null;
  for (const d of days) {
    run = prev && addDays(prev, 1) === d ? run + 1 : 1;
    best = Math.max(best, run);
    prev = d;
  }
  return best;
};

/** The single best lift: the heaviest weight record, else the most reps, else the longest hold. */
export const bestRecord = (sessions: Session[]): BestRecord | null => {
  const names = new Map<Id, string>();
  for (const s of sessions) for (const ex of s.exercises) names.set(ex.exerciseId, ex.exerciseName);
  const records = [...computeRecords(sessions).entries()].map(([exerciseId, r]) => ({ exerciseName: names.get(exerciseId) ?? 'Exercise', kind: r.kind, value: r.value }));
  const order: BestRecord['kind'][] = ['weight', 'reps', 'duration', 'distance'];
  for (const kind of order) {
    const ofKind = records.filter(r => r.kind === kind).sort((a, b) => b.value - a.value);
    if (ofKind[0]) return ofKind[0];
  }
  return null;
};

/** The exercise that shows up in the most sessions with at least one working set. */
export const favoriteExercise = (sessions: Session[]): string | null => {
  const counts = new Map<string, number>();
  for (const s of sessions) {
    if (s.status !== 'completed') continue;
    for (const ex of s.exercises) {
      if (workingSets(ex.sets).length === 0) continue;
      counts.set(ex.exerciseName, (counts.get(ex.exerciseName) ?? 0) + 1);
    }
  }
  let best: string | null = null;
  let n = 0;
  for (const [name, count] of counts) {
    if (count > n) {
      best = name;
      n = count;
    }
  }
  return best;
};

export interface CardInput {
  uid: Id;
  profile: UserProfile | null;
  /** Every session; only completed ones count. */
  sessions: Session[];
  unlocks: AchievementUnlock[];
  plans: Plan[];
  lastCycleCompletionRate: number | null;
  skippedLastScheduled: boolean;
  todayDate: LocalDate;
  now?: number;
}

/** Build the Iron Card (public profile) from the owner's private data. */
export const buildPublicProfile = (input: CardInput): PublicProfile => {
  const completed = input.sessions.filter(s => s.status === 'completed');
  const dates = completed.map(s => s.date).sort();
  return {
    id: input.uid,
    displayName: input.profile?.displayName ?? null,
    photoUrl: input.profile?.photoUrl ?? null,
    currentStreakDays: currentStreakDays(completed, input.todayDate, addDays),
    longestStreakDays: longestStreakDays(completed),
    totalSessions: completed.length,
    lastWorkoutDate: dates.length ? dates[dates.length - 1] : null,
    lastCycleCompletionRate: input.lastCycleCompletionRate,
    skippedLastScheduled: input.skippedLastScheduled,
    achievementIds: input.unlocks.map(u => u.achievementId),
    totalVolumeKg: totalVolumeKg(completed),
    bestRecord: bestRecord(completed),
    favoriteExercise: favoriteExercise(completed),
    trainingSince: input.profile?.createdAt ?? null,
    sharedPlanCount: input.plans.filter(p => p.visibleToBuddies && p.status !== 'archived').length,
    updatedAt: input.now ?? Date.now(),
  };
};

/** Characters that can't be confused with each other when read aloud or typed. */
const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
export const CODE_LENGTH = 6;

/** A new card code, e.g. "K7MP2X". Collisions are checked by the caller. */
export const generateInviteCode = (random: () => number = Math.random): string =>
  Array.from({ length: CODE_LENGTH }, () => CODE_ALPHABET[Math.floor(random() * CODE_ALPHABET.length)]).join('');

/** "K7MP2X" as people see it: "FLX-K7MP2X". */
export const formatInviteCode = (code: string): string => `FLX-${code}`;

/** The link encoded in the QR code. Scanning in the app understands both this and the bare code. */
export const inviteUrl = (code: string): string => `https://flexcoach.app/buddy/${code}`;

/**
 * Pull a code out of whatever was scanned or typed: the QR link, "FLX-K7MP2X",
 * "flx k7mp2x", or the bare code. Null when nothing usable is there.
 */
export const parseInviteCode = (raw: string): string | null => {
  const text = raw.trim();
  const fromUrl = text.match(/\/buddy\/([A-Za-z0-9]+)/);
  const candidate = (fromUrl ? fromUrl[1] : text).toUpperCase().replace(/^FLX[\s-]*/, '').replace(/[^A-Z0-9]/g, '');
  if (candidate.length !== CODE_LENGTH) return null;
  for (const ch of candidate) if (!CODE_ALPHABET.includes(ch)) return null;
  return candidate;
};

/** Streaks worth telling buddies about: every fifth day. */
export const isStreakMilestone = (streakDays: number): boolean => streakDays > 0 && streakDays % 5 === 0;
