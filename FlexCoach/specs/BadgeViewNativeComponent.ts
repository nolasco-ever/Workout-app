import type { CodegenTypes, HostComponent, ViewProps } from 'react-native';
import { codegenNativeComponent } from 'react-native';

/**
 * The native 3D badge: RealityKit on iOS, Filament on Android. It loads the
 * tier's body and the family's mark from the app's bundled models, lights
 * them with the studio environment, and turns on a horizontal drag; a flick
 * keeps it spinning and it coasts to a stop. See components/achievements/BadgeView.tsx.
 */
export interface NativeProps extends ViewProps {
  family: string;
  tier: CodegenTypes.Int32;
  /** Multiplier on the environment light; 1 is the studio default. */
  environmentIntensity?: CodegenTypes.Double;
  /** Multiplier on the key light; 1 is the default, 0 turns it off. */
  sunIntensity?: CodegenTypes.Double;
  /** Radians of turn per point of drag. */
  spinSensitivity?: CodegenTypes.Double;
  /** Per-millisecond velocity multiplier while coasting; 0.998 feels like a scroll. */
  deceleration?: CodegenTypes.Double;
  /** A one-off push, radians per millisecond: when this changes to a non-zero value the badge starts spinning and coasts to a stop. */
  spinImpulse?: CodegenTypes.Double;
  /** The angle the badge rests at, radians about the vertical axis; 0 faces the viewer. */
  restYaw?: CodegenTypes.Double;
  /** When this changes to a non-zero value the badge starts that many turns ahead of its resting angle and eases back to it. */
  spinIn?: CodegenTypes.Double;
  /** An extra turn added live, radians, for tying the badge to a swipe. */
  yawOffset?: CodegenTypes.Double;
  /** Text stamped on the back, digits and capital letters only, for the unlock date. Empty for none. */
  backText?: string;
  /** Colour of that text as #RRGGBB. */
  backTextColor?: string;
  /** Badges to load into the cache ahead of time, as "family:tier" joined by commas. */
  preload?: string;
  /** Fires once the current badge's model is loaded and drawn. */
  onReady?: CodegenTypes.DirectEventHandler<null> | null;
}

export default codegenNativeComponent<NativeProps>('BadgeView') as HostComponent<NativeProps>;
