import { paths } from '../firebase/paths';
import { BodyWeightEntry, Id } from '../models';
import { listDocs, orderBy, removeDoc, touch, watchDocs, where, writeDoc, writeDocs, Unsubscribe } from './base';

export const bodyWeightRepository = {
  list: (uid: Id) => listDocs<BodyWeightEntry>(paths.bodyWeight(uid), orderBy('date', 'asc')),

  listSince: (uid: Id, date: string) =>
    listDocs<BodyWeightEntry>(paths.bodyWeight(uid), where('date', '>=', date), orderBy('date', 'asc')),

  watch: (uid: Id, onChange: (entries: BodyWeightEntry[]) => void): Unsubscribe =>
    watchDocs<BodyWeightEntry>(paths.bodyWeight(uid), onChange, orderBy('date', 'asc')),

  save: (uid: Id, entry: BodyWeightEntry) => writeDoc(paths.bodyWeightEntry(uid, entry.id), touch(entry)),

  /** One commit for a whole import, so the Home tile and history update once. */
  saveMany: (uid: Id, entries: BodyWeightEntry[]) => writeDocs(entries.map(e => ({ path: paths.bodyWeightEntry(uid, e.id), data: touch(e) }))),

  remove: (uid: Id, entryId: Id) => removeDoc(paths.bodyWeightEntry(uid, entryId)),
};
