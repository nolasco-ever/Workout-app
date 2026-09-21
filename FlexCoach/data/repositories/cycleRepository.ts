import { paths } from '../firebase/paths';
import { Cycle, Id } from '../models';
import { listDocs, orderBy, readDoc, touch, watchDoc, writeDoc, Unsubscribe } from './base';

export const cycleRepository = {
  get: (uid: Id, cycleId: Id) => readDoc<Cycle>(paths.cycle(uid, cycleId)),

  watch: (uid: Id, cycleId: Id, onChange: (cycle: Cycle | null) => void): Unsubscribe =>
    watchDoc<Cycle>(paths.cycle(uid, cycleId), onChange),

  listAll: (uid: Id) => listDocs<Cycle>(paths.cycles(uid), orderBy('number', 'asc')),

  /** Filtered client-side: where + orderBy on different fields needs a composite index. */
  listForPlan: async (uid: Id, planId: Id) => (await listDocs<Cycle>(paths.cycles(uid), orderBy('number', 'asc'))).filter(c => c.planId === planId),

  save: (uid: Id, cycle: Cycle) => writeDoc(paths.cycle(uid, cycle.id), touch(cycle)),
};
