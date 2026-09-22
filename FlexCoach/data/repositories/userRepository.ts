import { paths } from '../firebase/paths';
import { Id, PublicProfile, UserProfile } from '../models';
import { listDocs, patchDoc, readDoc, removeDoc, watchDoc, writeDoc, Unsubscribe } from './base';

export const userRepository = {
  get: (uid: Id) => readDoc<UserProfile>(paths.user(uid)),

  watch: (uid: Id, onChange: (profile: UserProfile | null) => void): Unsubscribe =>
    watchDoc<UserProfile>(paths.user(uid), onChange),

  /** Create the profile document on first sign-in if it doesn't exist yet. */
  ensure: async (uid: Id, defaults: Partial<UserProfile> = {}): Promise<UserProfile> => {
    const existing = await readDoc<UserProfile>(paths.user(uid));
    if (existing) return existing;
    const now = Date.now();
    const profile: UserProfile = {
      id: uid,
      displayName: null,
      email: null,
      photoUrl: null,
      authProvider: 'password',
      weightUnit: 'lb',
      distanceUnit: 'mi',
      activePlanId: null,
      activeCycleId: null,
      targetWeightKg: null,
      healthConnectedAt: null,
      onboardingCompletedAt: null,
      createdAt: now,
      updatedAt: now,
      ...defaults,
    };
    await writeDoc(paths.user(uid), profile);
    return profile;
  },

  update: (uid: Id, patch: Partial<UserProfile>) =>
    patchDoc<UserProfile>(paths.user(uid), { ...patch, updatedAt: Date.now() }),

  getPublicProfile: (uid: Id) => readDoc<PublicProfile>(paths.publicProfile(uid)),

  writePublicProfile: (profile: PublicProfile) => writeDoc(paths.publicProfile(profile.id), profile),

  /** Remove every document under the user, then the profile documents. */
  deleteAllData: async (uid: Id): Promise<void> => {
    const collections = [paths.plans(uid), paths.cycles(uid), paths.sessions(uid), paths.bodyWeight(uid), paths.achievements(uid), paths.buddies(uid), paths.customExercises(uid)];
    for (const c of collections) {
      const docs = await listDocs<{ id: string }>(c);
      for (const d of docs) await removeDoc(`${c}/${d.id}`);
    }
    await removeDoc(paths.publicProfile(uid)).catch(() => undefined);
    await removeDoc(paths.user(uid));
  },
};
