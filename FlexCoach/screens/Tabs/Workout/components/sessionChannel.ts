import { Session } from '../../../../data/models';

/**
 * The running session, shared with the screens the session opens above
 * itself (the exercise list) without putting it in navigation params,
 * which would go stale as sets are logged. The session screen publishes
 * every change; the list screen reads and subscribes. Commands flow the
 * other way: jump to an exercise, remove one.
 */

let current: Session | null = null;
const sessionListeners = new Set<(session: Session) => void>();

export const publishSession = (session: Session): void => {
  current = session;
  sessionListeners.forEach(l => l(session));
};

export const currentSession = (): Session | null => current;

export const subscribeSession = (listener: (session: Session) => void): (() => void) => {
  sessionListeners.add(listener);
  return () => {
    sessionListeners.delete(listener);
  };
};

export type SessionCommand = { kind: 'jump'; index: number } | { kind: 'remove'; sessionExerciseId: string };
const commandListeners = new Set<(command: SessionCommand) => void>();

export const sendSessionCommand = (command: SessionCommand): void => {
  commandListeners.forEach(l => l(command));
};

export const subscribeSessionCommands = (listener: (command: SessionCommand) => void): (() => void) => {
  commandListeners.add(listener);
  return () => {
    commandListeners.delete(listener);
  };
};
