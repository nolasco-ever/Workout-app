import { paths } from '../firebase/paths';
import { Activity, Buddy, Id, InviteCode, PublicProfile } from '../models';
import { limit, listDocs, orderBy, readDoc, removeDoc, stamp, watchDoc, watchDocs, writeDoc, Unsubscribe } from './base';

/**
 * A buddy relationship is stored on both sides so each user's list is a
 * simple read of their own subtree, and security rules can check for the
 * relationship with a single `exists()`.
 */
export const buddyRepository = {
  list: (uid: Id) => listDocs<Buddy>(paths.buddies(uid)),

  watch: (uid: Id, onChange: (buddies: Buddy[]) => void): Unsubscribe => watchDocs<Buddy>(paths.buddies(uid), onChange),

  get: (uid: Id, otherUid: Id) => readDoc<Buddy>(paths.buddy(uid, otherUid)),

  /**
   * Make two people buddies in one go. `me` had `them`'s card, so the row
   * written into their list carries their code as proof (see the rules).
   * Both rows carry a name and photo snapshot for the list.
   */
  add: async (me: { uid: Id; displayName: string | null; photoUrl: string | null; inviteCode: string }, them: { uid: Id; displayName: string | null; photoUrl: string | null; inviteCode: string }): Promise<void> => {
    await writeDoc(paths.buddy(them.uid, me.uid), stamp<Buddy>({ id: me.uid, userId: me.uid, status: 'accepted', displayName: me.displayName, photoUrl: me.photoUrl, inviteCode: me.inviteCode, viaCode: them.inviteCode } as Buddy));
    await writeDoc(paths.buddy(me.uid, them.uid), stamp<Buddy>({ id: them.uid, userId: them.uid, status: 'accepted', displayName: them.displayName, photoUrl: them.photoUrl, inviteCode: them.inviteCode } as Buddy));
  },

  /** Remove: both rows go. Either side may do it. */
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
