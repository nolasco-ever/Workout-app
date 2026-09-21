import { paths } from '../firebase/paths';
import { Id, Plan } from '../models';
import { listDocs, orderBy, patchDoc, readDoc, touch, watchDocs, where, writeDoc, Unsubscribe } from './base';
import { userRepository } from './userRepository';

export const planRepository = {
  get: (uid: Id, planId: Id) => readDoc<Plan>(paths.plan(uid, planId)),

  list: (uid: Id) => listDocs<Plan>(paths.plans(uid), orderBy('updatedAt', 'desc')),

  listActiveAndDrafts: (uid: Id) => listDocs<Plan>(paths.plans(uid), where('status', 'in', ['active', 'draft'])),

  watchAll: (uid: Id, onChange: (plans: Plan[]) => void): Unsubscribe =>
    watchDocs<Plan>(paths.plans(uid), onChange, orderBy('updatedAt', 'desc')),

  save: (uid: Id, plan: Plan) => writeDoc(paths.plan(uid, plan.id), touch(plan)),

  /**
   * Make a plan the active one. Any previously active plan is archived,
   * since only one plan can be active at a time.
   */
  activate: async (uid: Id, planId: Id): Promise<void> => {
    const active = await listDocs<Plan>(paths.plans(uid), where('status', '==', 'active'));
    const now = Date.now();
    await Promise.all(
      active
        .filter(p => p.id !== planId)
        .map(p => patchDoc<Plan>(paths.plan(uid, p.id), { status: 'archived', archivedAt: now, updatedAt: now })),
    );
    await patchDoc<Plan>(paths.plan(uid, planId), { status: 'active', archivedAt: null, updatedAt: now });
    await userRepository.update(uid, { activePlanId: planId });
  },

  archive: async (uid: Id, planId: Id): Promise<void> => {
    const now = Date.now();
    await patchDoc<Plan>(paths.plan(uid, planId), { status: 'archived', archivedAt: now, updatedAt: now });
    const profile = await userRepository.get(uid);
    if (profile?.activePlanId === planId) {
      await userRepository.update(uid, { activePlanId: null, activeCycleId: null });
    }
  },

  /**
   * Copy a plan into another user's account. The copy is a fully independent
   * draft; the recipient can edit or activate it like one they built.
   */
  copyTo: async (recipientUid: Id, source: Plan, sharedByUid: Id, newId: () => Id): Promise<Plan> => {
    const now = Date.now();
    const copy: Plan = {
      ...source,
      id: newId(),
      ownerId: recipientUid,
      status: 'draft',
      archivedAt: null,
      sharedFrom: { userId: sharedByUid, planId: source.id, sharedAt: now },
      workouts: source.workouts.map(w => ({
        ...w,
        id: newId(),
        exercises: w.exercises.map(e => ({ ...e, id: newId() })),
      })),
      createdAt: now,
      updatedAt: now,
    };
    // Workout ids changed, so remap the schedule to the new ids.
    const idMap = new Map(source.workouts.map((w, i) => [w.id, copy.workouts[i].id]));
    const remap = (id: Id | null) => (id ? idMap.get(id) ?? null : null);
    copy.schedule =
      source.schedule.mode === 'rotation'
        ? { ...source.schedule, slots: source.schedule.slots.map(remap) }
        : { ...source.schedule, weekdays: source.schedule.weekdays.map(remap) as typeof source.schedule.weekdays };
    await writeDoc(paths.plan(recipientUid, copy.id), copy);
    return copy;
  },
};
