import { paths } from '../firebase/paths';
import { Id, Plan } from '../models';
import { mapScheduleDays, normalizePlan, toStoredPlan } from '../engine/scheduleDays';
import { listDocs, mergeDoc, orderBy, patchDoc, readDoc, removeDoc, touch, watchDoc, watchDocOrError, watchDocs, where, writeDoc, Unsubscribe } from './base';
import { userRepository } from './userRepository';

export const planRepository = {
  get: (uid: Id, planId: Id) => readDoc<Plan>(paths.plan(uid, planId)).then(normalizePlan),

  watch: (uid: Id, planId: Id, onChange: (plan: Plan | null) => void): Unsubscribe =>
    watchDoc<Plan>(paths.plan(uid, planId), plan => onChange(normalizePlan(plan))),

  list: (uid: Id) => listDocs<Plan>(paths.plans(uid), orderBy('updatedAt', 'desc')).then(plans => plans.map(normalizePlan)),

  listActiveAndDrafts: (uid: Id) => listDocs<Plan>(paths.plans(uid), where('status', 'in', ['active', 'draft'])).then(plans => plans.map(normalizePlan)),

  /** Plans a buddy shares. The filter is what the security rule allows a buddy to query. */
  listSharedBy: (ownerUid: Id) => listDocs<Plan>(paths.plans(ownerUid), where('visibleToBuddies', '==', true)).then(plans => plans.map(normalizePlan)),

  /**
   * Follow a buddy's plan. `onError` fires when it can no longer be read
   * (un-shared, or the buddy relationship ended); `onChange` gets null when
   * it was deleted.
   */
  watchShared: (ownerUid: Id, planId: Id, onChange: (plan: Plan | null) => void, onError: (err: unknown) => void): Unsubscribe =>
    watchDocOrError<Plan>(paths.plan(ownerUid, planId), plan => onChange(normalizePlan(plan)), onError),

  setVisibleToBuddies: (uid: Id, planId: Id, visible: boolean) => patchDoc<Plan>(paths.plan(uid, planId), { visibleToBuddies: visible, updatedAt: Date.now() }),

  watchAll: (uid: Id, onChange: (plans: Plan[]) => void): Unsubscribe =>
    watchDocs<Plan>(paths.plans(uid), plans => onChange(plans.map(normalizePlan)), orderBy('updatedAt', 'desc')),

  // Every plan write goes through toStoredPlan: Firestore can't hold the schedule's list of lists as is.
  save: (uid: Id, plan: Plan) => writeDoc(paths.plan(uid, plan.id), touch(toStoredPlan(plan))),

  /**
   * Background save of a plan still being built. The first write creates the
   * document as a draft; later ones merge only what the editor changes, so
   * a save that lands after the user activated the plan can't demote it.
   */
  autosave: (uid: Id, plan: Plan, exists: boolean): Promise<void> => {
    if (!exists) return writeDoc(paths.plan(uid, plan.id), touch(toStoredPlan({ ...plan, status: 'draft' as const })));
    const { name, description, goal, workouts, schedule } = plan;
    return mergeDoc<Plan>(paths.plan(uid, plan.id), toStoredPlan({ name, description, goal, workouts, schedule, updatedAt: Date.now() }));
  },

  /**
   * Make a plan the active one. Only one plan can be active, so any other
   * active plan becomes inactive (status 'draft'); archiving is a separate,
   * deliberate action.
   */
  activate: async (uid: Id, planId: Id): Promise<void> => {
    const active = await listDocs<Plan>(paths.plans(uid), where('status', '==', 'active'));
    const now = Date.now();
    await Promise.all(
      active
        .filter(p => p.id !== planId)
        .map(p => patchDoc<Plan>(paths.plan(uid, p.id), { status: 'draft', updatedAt: now })),
    );
    await patchDoc<Plan>(paths.plan(uid, planId), { status: 'active', archivedAt: null, updatedAt: now });
    await userRepository.update(uid, { activePlanId: planId });
  },

  unarchive: (uid: Id, planId: Id) => patchDoc<Plan>(paths.plan(uid, planId), { status: 'draft', archivedAt: null, updatedAt: Date.now() }),

  remove: (uid: Id, planId: Id) => removeDoc(paths.plan(uid, planId)),

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
  /**
   * Save a buddy's plan as the recipient's own draft. A plain copy gets
   * fresh workout and exercise ids. A synced copy keeps the source's ids,
   * so later updates from the buddy line up with the cycle and the logged
   * sessions that point at them.
   */
  copyTo: async (recipientUid: Id, source: Plan, sharedBy: { uid: Id; displayName?: string | null }, newId: () => Id, synced = false): Promise<Plan> => {
    const now = Date.now();
    const copy: Plan = {
      ...source,
      id: newId(),
      ownerId: recipientUid,
      status: 'draft',
      archivedAt: null,
      visibleToBuddies: false,
      sharedFrom: { userId: sharedBy.uid, planId: source.id, sharedAt: now, displayName: sharedBy.displayName ?? null, synced, sourceUpdatedAt: source.updatedAt },
      workouts: synced
        ? source.workouts
        : source.workouts.map(w => ({
            ...w,
            id: newId(),
            exercises: w.exercises.map(e => ({ ...e, id: newId() })),
          })),
      createdAt: now,
      updatedAt: now,
    };
    if (!synced) {
      // Workout ids changed, so remap the schedule to the new ids.
      const idMap = new Map(source.workouts.map((w, i) => [w.id, copy.workouts[i].id]));
      copy.schedule = mapScheduleDays(source.schedule, day => day.map(id => idMap.get(id)).filter((id): id is Id => !!id));
    }
    await writeDoc(paths.plan(recipientUid, copy.id), toStoredPlan(copy));
    return copy;
  },
};
