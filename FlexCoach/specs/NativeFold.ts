import type { CodegenTypes, TurboModule } from 'react-native';
import { TurboModuleRegistry } from 'react-native';

/**
 * What the native side knows about a folding phone, flat so it crosses the
 * bridge as one record. Points, window coordinates. See data/fold/useFold.ts
 * for the typed, derived shape the app uses.
 *
 * posture: 'closed' | 'open' | 'book' | 'tabletop' | 'tent' | 'unknown'
 * hingeStatus: 'closed' | 'partiallyOpen' | 'fullyOpen' | 'unknown' | 'none'
 * foldAxis: 'vertical' | 'horizontal' | 'none'
 */
export type NativeFoldState = {
  foldable: boolean;
  posture: string;
  hingeStatus: string;
  /** Degrees, 0 closed to 180 flat; -1 when the hinge reports no angle. */
  hingeAngleDeg: number;
  foldAxis: string;
  foldX: number;
  foldY: number;
  foldWidth: number;
  foldHeight: number;
  /** The fold region only counts while the phone is partly folded. */
  foldActive: boolean;
  windowWidth: number;
  windowHeight: number;
};

/** Hinge and fold state of a folding phone: iOS 27.1's hinge interaction and reserved regions, Android's WindowManager fold feature and hinge sensor. */
export interface Spec extends TurboModule {
  /** The last state the native side computed; a neutral record until the first layout. */
  getState(): NativeFoldState;
  readonly onChange: CodegenTypes.EventEmitter<NativeFoldState>;
}

export default TurboModuleRegistry.get<Spec>('NativeFold');
