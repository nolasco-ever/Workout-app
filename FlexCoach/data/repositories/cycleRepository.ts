import { paths } from '../firebase/paths';
import { Cycle, Id } from '../models';
import { listDocs, orderBy, readDoc, touch, watchDoc, where, writeDoc, Unsubscribe } from './base';

export const cycleRepository = {
  get: (uid: Id, cycleId: Id) => readDoc<Cycle>(paths.cycle(uid, cycleId)),

  watch: (uid: Id, cycleId: Id, onChange: (cycle: Cycle | null) => void): Unsubscribe =>
    watchDoc<Cycle>(paths.cycle(uid, cycleId), onChange),

  listForPlan: (uid: Id, planId: Id) =>
    listDocs<Cycle>(paths.cycles(uid), where('planId', '==', planId), orderBy('number', 'asc')),

  save: (uid: Id, cycle: Cycle) => writeDoc(paths.cycle(uid, cycle.id), touch(cycle)),
};
