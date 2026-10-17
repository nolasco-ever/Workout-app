import { Platform } from 'react-native';
import NativeLiveActivity, { LiveActivityCommand } from '../../specs/NativeLiveActivity';

/**
 * What the workout's Live Activity shows (iOS 16.2+, lock screen card and
 * Dynamic Island). One activity per workout: started at Start workout,
 * updated as the session moves, ended on finish or leave. Times are
 * milliseconds since 1970; the clocks tick on the device from them.
 */
export type LiveActivityPhase = 'working' | 'rest' | 'restOver' | 'cardio' | 'done';

export type LiveActivityState = {
  phase: LiveActivityPhase;
  exerciseName: string;
  /** "Set 2 of 3" */
  setLabel: string;
  /** "185 lb × 8": the set the Island's check logs. */
  nextTarget?: string;
  nextSetId?: string;
  restEndsAt?: number;
  /** The exercise's rest length, so a set logged from the Island starts its rest without the app. */
  restSeconds: number;
  cardioStartedAt?: number;
  cardioTargetSeconds?: number;
  /** When the workout began: the elapsed clock on the lock screen. */
  startedAt: number;
  /** The done state's line: "18 sets · 12,400 lb · 1 record". */
  summary?: string;
};

export type { LiveActivityCommand };
export type LiveActivityCommandKind = 'completeSet' | 'skipRest' | 'stopCardio';

const native = Platform.OS === 'ios' ? NativeLiveActivity : null;

/** How long the done card stays on the lock screen after a workout. */
export const DONE_LINGER_SECONDS = 15 * 60;

/** The Live Activity, or a quiet no-op where there is none (Android, iOS before 16.2, Live Activities switched off). */
export const liveActivity = {
  supported: (): boolean => !!native && native.isSupported(),
  active: (): boolean => !!native && native.isActive(),
  start: (workoutName: string, sessionId: string, state: LiveActivityState): boolean => (native ? native.start(workoutName, sessionId, JSON.stringify(state)) : false),
  /** `alert`: the Island opens on this update for a moment and the lock screen lights up. */
  update: (state: LiveActivityState, alert = false): void => native?.update(JSON.stringify(state), alert),
  /** Ends it; with a final state it lingers for `lingerSeconds`. */
  end: (state: LiveActivityState | null = null, lingerSeconds = 0): void => native?.end(state ? JSON.stringify(state) : '', lingerSeconds),
  endAll: (): void => native?.endAll(),
  /** Commands tapped while the app was not running, oldest first. */
  drainCommands: (): LiveActivityCommand[] => (native ? native.drainCommands() : []),
  /** The activity's push token (hex) once Apple has issued it: a server updates the activity with it while the app sleeps. */
  pushToken: (): string | null => (native ? native.pushToken() || null : null),
  onPushToken: (listener: (token: string) => void): (() => void) => {
    if (!native) return () => undefined;
    const subscription = native.onPushToken(({ token }) => listener(token));
    return () => subscription.remove();
  },
  /** Commands tapped while the app is running. */
  onCommand: (listener: (command: LiveActivityCommand) => void): (() => void) => {
    if (!native) return () => undefined;
    const subscription = native.onCommand(listener);
    return () => subscription.remove();
  },
};
