import type { TurboModule } from 'react-native';
import { TurboModuleRegistry } from 'react-native';

/** One GPS reading: degrees, ms since 1970, horizontal accuracy in meters. */
export type NativeRoutePoint = {
  lat: number;
  lon: number;
  t: number;
  acc: number;
};

/**
 * The phone's GPS for an outdoor cardio entry (v1 #10.8). It keeps recording
 * with the screen off: on iOS with the location indicator showing, on
 * Android as a foreground service with its own notification. Readings wait
 * on the native side until JavaScript takes them.
 */
export interface Spec extends TurboModule {
  /** Asks for location if it hasn't been asked, without recording. Resolves 'granted' or 'denied'. */
  authorize(): Promise<string>;
  /** Asks for location if it hasn't been asked, then starts recording. Resolves 'granted' or 'denied'. */
  start(): Promise<string>;
  stop(): void;
  /** The readings since the last take, oldest first; cleared once taken. */
  takePoints(): Array<NativeRoutePoint>;
}

export default TurboModuleRegistry.get<Spec>('NativeRouteTracker');
