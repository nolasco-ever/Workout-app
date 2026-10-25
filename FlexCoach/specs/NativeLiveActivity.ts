import type { CodegenTypes, TurboModule } from 'react-native';
import { TurboModuleRegistry } from 'react-native';

/**
 * A button tapped on the workout's Live Activity (iOS 17+): `completeSet`
 * with the set's id, `skipRest`, or `stopCardio`. `at` is milliseconds since
 * 1970. See data/liveActivity/liveActivity.ts for the typed state the app
 * sends; it crosses the bridge as a JSON string.
 */
export type LiveActivityCommand = {
  kind: string;
  id: string;
  at: number;
};

/** What the Apple Watch measured over one workout (v1 #6), sent when it finishes; `avgBpm`/`maxBpm` are 0 with no heart rate. */
export type WatchMetricsEvent = {
  sessionId: string;
  kcal: number;
  avgBpm: number;
  maxBpm: number;
};

/** The workout's Live Activity on iOS (lock screen card + Dynamic Island), driven by the running session. Absent on Android. */
export interface Spec extends TurboModule {
  /** iOS 16.2 or later with Live Activities allowed in Settings. */
  isSupported(): boolean;
  isActive(): boolean;
  /** Starts the workout's activity (ending any left from before). `stateJson` is a LiveActivityState as JSON. */
  start(workoutName: string, sessionId: string, stateJson: string): boolean;
  /** `alert`: the update opens the Island for a moment and lights the lock screen (a rest running out). */
  update(stateJson: string, alert: boolean): void;
  /** Ends it. With a final state it lingers on the lock screen for `lingerSeconds`; with an empty string it goes at once. */
  end(stateJson: string, lingerSeconds: number): void;
  endAll(): void;
  /** Commands tapped while the app was not running, oldest first; cleared once taken. */
  drainCommands(): Array<LiveActivityCommand>;
  readonly onCommand: CodegenTypes.EventEmitter<LiveActivityCommand>;
  /** The running activity's push token (hex), or '' until Apple issues it; also sent as `onPushToken` when it arrives or rotates. */
  pushToken(): string;
  readonly onPushToken: CodegenTypes.EventEmitter<{ token: string }>;
  /** The Watch's numbers for workouts that finished while JavaScript was not listening; cleared once taken. */
  takeWatchMetrics(): Array<WatchMetricsEvent>;
  readonly onWatchMetrics: CodegenTypes.EventEmitter<WatchMetricsEvent>;
  /** What the Watch shows with no workout running (data/liveActivity/watchHome.ts), as JSON; sent whenever it changes. */
  setWatchHome(homeJson: string): void;
  /** Exercises found for the Watch's search, as JSON `{query, results}`. */
  setWatchSearch(resultsJson: string): void;
  /** Requests from the Watch (start a workout, a quick workout, resume, search) JavaScript has not taken yet; cleared once taken. */
  takeWatchRequests(): Array<LiveActivityCommand>;
  readonly onWatchRequest: CodegenTypes.EventEmitter<LiveActivityCommand>;
}

export default TurboModuleRegistry.get<Spec>('NativeLiveActivity');
