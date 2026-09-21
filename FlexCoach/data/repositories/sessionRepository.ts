import { paths } from '../firebase/paths';
import { Id, LoggedSet, Session } from '../models';
import { listDocs, orderBy, patchDoc, readDoc, touch, watchDocs, where, writeDoc, Unsubscribe } from './base';

export const sessionRepository = {
  get: (uid: Id, sessionId: Id) => readDoc<Session>(paths.session(uid, sessionId)),

  listAll: (uid: Id) => listDocs<Session>(paths.sessions(uid), orderBy('startedAt', 'asc')),

  listForCycle: (uid: Id, cycleId: Id) =>
    listDocs<Session>(paths.sessions(uid), where('cycleId', '==', cycleId), orderBy('startedAt', 'asc')),

  listCompletedSince: (uid: Id, date: string) =>
    listDocs<Session>(paths.sessions(uid), where('status', '==', 'completed'), where('date', '>=', date), orderBy('date', 'asc')),

  watchInProgress: (uid: Id, onChange: (sessions: Session[]) => void): Unsubscribe =>
    watchDocs<Session>(paths.sessions(uid), onChange, where('status', '==', 'in_progress')),

  save: (uid: Id, session: Session) => writeDoc(paths.session(uid, session.id), touch(session)),

  /**
   * Persist a single set. The whole session document is rewritten because
   * sets are embedded, but Firestore diffs locally so this stays cheap and
   * works offline.
   */
  logSet: async (uid: Id, session: Session, exerciseId: Id, set: LoggedSet): Promise<Session> => {
    const updated: Session = {
      ...session,
      exercises: session.exercises.map(ex =>
        ex.id === exerciseId ? { ...ex, sets: ex.sets.map(s => (s.id === set.id ? set : s)) } : ex,
      ),
    };
    await patchDoc<Session>(paths.session(uid, session.id), { exercises: updated.exercises, updatedAt: Date.now() });
    return touch(updated);
  },

  finish: async (uid: Id, session: Session, status: 'completed' | 'abandoned'): Promise<Session> => {
    const now = Date.now();
    const finished: Session = { ...session, status, finishedAt: now, updatedAt: now };
    await patchDoc<Session>(paths.session(uid, session.id), { status, finishedAt: now, updatedAt: now });
    return finished;
  },

  /** Most recent completed session containing an exercise, for progression. */
  lastForExercise: async (uid: Id, exerciseId: Id): Promise<Session | null> => {
    const sessions = await listDocs<Session>(
      paths.sessions(uid),
      where('status', '==', 'completed'),
      orderBy('startedAt', 'desc'),
    );
    return sessions.find(s => s.exercises.some(ex => ex.exerciseId === exerciseId)) ?? null;
  },
};
