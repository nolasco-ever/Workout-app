import { paths } from '../firebase/paths';
import { Activity, Buddy, Id, InviteCode, PublicProfile } from '../models';
import { limit, listDocs, orderBy, patchDoc, readDoc, removeDoc, stamp, watchDoc, watchDocs, writeDoc, Unsubscribe } from './base';

/**
 * A buddy relationship is stored on both sides so each user's list is a
 * simple read of their own subtree, and security rules can check for the
 * relationship with a single `exists()`.
 */
export const buddyRepository = {
  list: (uid: Id) => listDocs<Buddy>(paths.buddies(uid)),

  watch: (uid: Id, onChange: (buddies: Buddy[]) => void): Unsubscribe => watchDocs<Buddy>(paths.buddies(uid), onChange),

  get: (uid: Id, otherUid: Id) => readDoc<Buddy>(paths.buddy(uid, otherUid)),

  /** Both rows carry a name and photo snapshot so pending lists can show who's who. */
  sendRequest: async (from: { uid: Id; displayName: string | null; photoUrl: string | null }, to: { uid: Id; displayName: string | null; photoUrl: string | null }): Promise<void> => {
    await writeDoc(paths.buddy(from.uid, to.uid), stamp<Buddy>({ id: to.uid, userId: to.uid, status: 'pending_sent', displayName: to.displayName, photoUrl: to.photoUrl } as Buddy));
    await writeDoc(paths.buddy(to.uid, from.uid), stamp<Buddy>({ id: from.uid, userId: from.uid, status: 'pending_received', displayName: from.displayName, photoUrl: from.photoUrl } as Buddy));
  },

  /** The recipient accepts: their own row first, then the requester's row about them. */
  accept: async (uid: Id, otherUid: Id): Promise<void> => {
    const now = Date.now();
    await patchDoc<Buddy>(paths.buddy(uid, otherUid), { status: 'accepted', updatedAt: now });
    await patchDoc<Buddy>(paths.buddy(otherUid, uid), { status: 'accepted', updatedAt: now });
  },

  /** Decline, cancel, or remove: both rows go. Either side may do it. */
  remove: async (uid: Id, otherUid: Id): Promise<void> => {
    await removeDoc(paths.buddy(uid, otherUid)).catch(() => undefined);
    await removeDoc(paths.buddy(otherUid, uid)).catch(() => undefined);
  },

  getPublicProfile: (uid: Id) => readDoc<PublicProfile>(paths.publicProfile(uid)),

  watchPublicProfile: (uid: Id, onChange: (p: PublicProfile | null) => void): Unsubscribe => watchDoc<PublicProfile>(paths.publicProfile(uid), onChange),

  /** Most recent activity of one person, newest first. */
  listActivity: (uid: Id, max = 20) => listDocs<Activity>(paths.activity(uid), orderBy('at', 'desc'), limit(max)),

  addActivity: (uid: Id, item: Activity) => writeDoc(paths.activityItem(uid, item.id), item),

  getInviteCode: (code: string) => readDoc<InviteCode>(paths.inviteCode(code)),

  writeInviteCode: (doc: InviteCode) => writeDoc(paths.inviteCode(doc.code), doc),
};
