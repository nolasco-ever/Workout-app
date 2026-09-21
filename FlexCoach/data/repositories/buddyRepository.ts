import { paths } from '../firebase/paths';
import { Buddy, Id } from '../models';
import { listDocs, removeDoc, stamp, watchDocs, writeDoc, Unsubscribe } from './base';

/**
 * A buddy relationship is stored on both sides so each user's list is a
 * simple read of their own subtree, and security rules can check for the
 * relationship with a single `exists()`.
 */
export const buddyRepository = {
  list: (uid: Id) => listDocs<Buddy>(paths.buddies(uid)),

  watch: (uid: Id, onChange: (buddies: Buddy[]) => void): Unsubscribe => watchDocs<Buddy>(paths.buddies(uid), onChange),

  sendRequest: async (fromUid: Id, toUid: Id): Promise<void> => {
    await writeDoc(paths.buddy(fromUid, toUid), stamp<Buddy>({ id: toUid, userId: toUid, status: 'pending_sent' } as Buddy));
    await writeDoc(paths.buddy(toUid, fromUid), stamp<Buddy>({ id: fromUid, userId: fromUid, status: 'pending_received' } as Buddy));
  },

  accept: async (uid: Id, otherUid: Id): Promise<void> => {
    const now = Date.now();
    await writeDoc(paths.buddy(uid, otherUid), { id: otherUid, userId: otherUid, status: 'accepted', createdAt: now, updatedAt: now });
    await writeDoc(paths.buddy(otherUid, uid), { id: uid, userId: uid, status: 'accepted', createdAt: now, updatedAt: now });
  },

  remove: async (uid: Id, otherUid: Id): Promise<void> => {
    await removeDoc(paths.buddy(uid, otherUid));
    await removeDoc(paths.buddy(otherUid, uid));
  },
};
