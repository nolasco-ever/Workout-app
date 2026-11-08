/**
 * One-time notices to testers and users about a change (v1 #10.10): the
 * reusable Notice sheet. Each is shown once per account, one at a time, on
 * the Workout tab. Someone whose account is newer than a notice never sees
 * it: what it announces was already there when they joined (owner,
 * 2026-11-08).
 */

/** A line of a notice: plain text with bold parts. */
export type NoticeText = (string | { bold: string })[];

export interface NoticeContent {
  intro?: string;
  /** The lines in the box, each with a check. */
  items: NoticeText[];
  footnote?: string;
  /** Under "Got it", a second way out (e.g. to the setting the notice is about). */
  secondary?: { label: string; target: 'sharing' };
}

export interface NoticeEntry {
  id: string;
  /** When it went out, ms since 1970: accounts made after this don't get it. */
  since: number;
}

/** The first notice the account hasn't seen and is old enough for, in the order given; null for none. */
export const dueNotice = <N extends NoticeEntry>(notices: N[], seen: string[] | null | undefined, accountCreatedAt: number): N | null =>
  notices.find(n => !(seen ?? []).includes(n.id) && accountCreatedAt < n.since) ?? null;

/** The seen list with one more, kept free of repeats. */
export const markSeen = (seen: string[] | null | undefined, id: string): string[] => [...new Set([...(seen ?? []), id])];
