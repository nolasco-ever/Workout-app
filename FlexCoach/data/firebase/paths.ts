import { Id } from '../models';

/** Firestore collection and document paths. Keep in sync with firestore.rules. */
export const paths = {
  user: (uid: Id) => `users/${uid}`,
  plans: (uid: Id) => `users/${uid}/plans`,
  plan: (uid: Id, planId: Id) => `users/${uid}/plans/${planId}`,
  cycles: (uid: Id) => `users/${uid}/cycles`,
  cycle: (uid: Id, cycleId: Id) => `users/${uid}/cycles/${cycleId}`,
  sessions: (uid: Id) => `users/${uid}/sessions`,
  session: (uid: Id, sessionId: Id) => `users/${uid}/sessions/${sessionId}`,
  bodyWeight: (uid: Id) => `users/${uid}/bodyWeight`,
  bodyWeightEntry: (uid: Id, entryId: Id) => `users/${uid}/bodyWeight/${entryId}`,
  achievements: (uid: Id) => `users/${uid}/achievements`,
  achievement: (uid: Id, achievementId: Id) => `users/${uid}/achievements/${achievementId}`,
  buddies: (uid: Id) => `users/${uid}/buddies`,
  buddy: (uid: Id, otherUid: Id) => `users/${uid}/buddies/${otherUid}`,
  customExercises: (uid: Id) => `users/${uid}/customExercises`,
  customExercise: (uid: Id, exerciseId: Id) => `users/${uid}/customExercises/${exerciseId}`,
  publicProfile: (uid: Id) => `publicProfiles/${uid}`,
};
