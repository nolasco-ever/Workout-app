import React from 'react';
import { Platform, StyleProp, ViewStyle } from 'react-native';
import NativeBadgeView from '../../specs/BadgeViewNativeComponent';
import { AchievementFamilyId } from '../../data/models';
import { artFor } from './badgeArt';

/** How the badge is lit: multipliers on the studio environment and the key light. */
export interface BadgeLighting {
  environment: number;
  sun: number;
}
/** Chosen by eye on the simulator and emulator, 2026-10-14; the two renderers scale their environments differently. */
export const DEFAULT_LIGHTING: BadgeLighting = Platform.OS === 'ios' ? { environment: 4.1, sun: 1.25 } : { environment: 1.68, sun: 1.25 };

/** How the badge answers a drag and a flick. */
export interface SpinFeel {
  /** Radians of turn per point of horizontal drag. */
  radiansPerPoint: number;
  /** Per-millisecond velocity multiplier once released; 0.998 is a phone's scroll. */
  deceleration: number;
}
export const DEFAULT_SPIN: SpinFeel = { radiansPerPoint: 0.012, deceleration: 0.998 };

interface Props {
  family: AchievementFamilyId;
  /** 1 and up; the locked look is not a model. */
  tier: number;
  style?: StyleProp<ViewStyle>;
  lighting?: BadgeLighting;
  spin?: SpinFeel;
  /** A one-off push in radians per millisecond; set it to a non-zero value to start a spin that coasts to a stop. */
  spinImpulse?: number;
  /** The angle the badge rests at, radians; 0 faces the viewer. */
  restYaw?: number;
  /** Set to a number of turns to wind the badge ahead and ease it back to its resting angle. */
  spinIn?: number;
  /** A live extra turn in radians, for tying the badge to a swipe. */
  yawOffset?: number;
  /** When the badge was earned; stamped on the back as "12 OCT 2026". */
  unlockedAt?: number | null;
  /** Badges to load ahead of time, so switching to them is instant. */
  preload?: Array<{ family: AchievementFamilyId; tier: number }>;
  /** Fires once this badge's model is loaded and drawn; before that the view is empty. */
  onReady?: () => void;
}

/** The slight turn a badge rests at when it is the hero of a screen: front to the viewer, turned a little to the right. */
export const HERO_REST_YAW = 0.35;

const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
/** "12 OCT 2026" in the device's local calendar. */
export const backDateText = (unlockedAt: number): string => {
  const d = new Date(unlockedAt);
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
};

/**
 * The spinning 3D badge, drawn natively (RealityKit on iOS, Filament on
 * Android) from the bundled models. Drag sideways to turn it; a flick keeps
 * it spinning and it coasts to a stop. Transparent, so it sits on any ground.
 */
export const BadgeView = ({ family, tier, style, lighting = DEFAULT_LIGHTING, spin = DEFAULT_SPIN, spinImpulse = 0, restYaw = 0, spinIn = 0, yawOffset = 0, unlockedAt = null, preload, onReady }: Props) => (
  <NativeBadgeView
    family={family}
    tier={Math.max(1, Math.round(tier))}
    environmentIntensity={lighting.environment}
    sunIntensity={lighting.sun}
    spinSensitivity={spin.radiansPerPoint}
    deceleration={spin.deceleration}
    spinImpulse={spinImpulse}
    restYaw={restYaw}
    spinIn={spinIn}
    yawOffset={yawOffset}
    backText={unlockedAt ? backDateText(unlockedAt) : ''}
    backTextColor={artFor(tier).dark}
    preload={preload ? preload.map(p => `${p.family}:${p.tier}`).join(',') : ''}
    onReady={onReady ? () => onReady() : undefined}
    style={[{ width: 280, height: 280 }, style]}
  />
);
