import { NoticeContent, NoticeEntry } from '../data/engine/notices';
import { splitNotice } from '../data/engine/planSplit';
import { Plan, UserProfile } from '../data/models';

/** What a notice can read to fill itself in. */
export interface NoticeContext {
  profile: UserProfile;
  plans: Plan[];
}

export interface NoticeDef extends NoticeEntry {
  /** Its content for this account, or null when it doesn't apply (it is then skipped, not marked seen). */
  content: (ctx: NoticeContext) => NoticeContent | null;
}

/**
 * The notices, oldest first (v1 #10.10). Each is shown once per account on
 * the Workout tab, one per visit; see data/engine/notices.ts for who gets
 * which. Add one with a new id and today's date; never reuse an id.
 */
export const notices: NoticeDef[] = [
  {
    // v1 #10.9: routes are saved now, and stay private unless shared.
    id: 'route-maps',
    since: new Date(2026, 10, 8).getTime(),
    content: () => ({
      items: [
        ["Outdoor cardio now saves your route. You'll see the map when you finish and in History."],
        ["Buddies can't see your routes unless you turn on ", { bold: 'Route maps' }, ' in What buddies see.'],
      ],
      secondary: { label: 'Open What buddies see', target: 'sharing' },
    }),
  },
  {
    // v1 #10.11: what the split moved in each plan. Skipped (not marked seen) until a plan has been split.
    id: 'plan-split',
    since: new Date(2026, 10, 8).getTime(),
    content: ({ plans }) => splitNotice(plans),
  },
];
