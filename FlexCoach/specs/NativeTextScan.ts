import type { TurboModule } from 'react-native';
import { TurboModuleRegistry } from 'react-native';

/** One line of text found in a photo, with its box from 0 to 1 across and down the upright photo. */
export type NativeTextPiece = {
  text: string;
  x: number;
  y: number;
  w: number;
  h: number;
};

/**
 * Text recognition on the device (v1 #10.7, the console scan): Apple Vision
 * on iOS, ML Kit with its bundled model on Android. Nothing leaves the phone.
 */
export interface Spec extends TurboModule {
  /** The lines of text in the photo at `uri` (a file:// or content:// address); empty when there are none. */
  readText(uri: string): Promise<Array<NativeTextPiece>>;
}

export default TurboModuleRegistry.get<Spec>('NativeTextScan');
