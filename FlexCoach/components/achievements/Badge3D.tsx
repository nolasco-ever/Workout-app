import React from 'react';
import { StyleProp, View, ViewStyle } from 'react-native';
import { Camera, EnvironmentalLight, FilamentScene, FilamentView, Light, Model, useSyncSharedValue } from 'react-native-filament';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { useDerivedValue, useSharedValue, withDecay } from 'react-native-reanimated';
import { AchievementFamilyId } from '../../data/models';
import { BADGE_BODIES, badgeOverlayFor } from './badgeModels';

/** How the badge is lit. Filament units: lux for both sources, kelvin for the sun's colour. */
export interface BadgeLighting {
  environment: number;
  sun: number;
  kelvin: number;
}
export const DEFAULT_LIGHTING: BadgeLighting = { environment: 30_000, sun: 10_000, kelvin: 6_500 };

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
  tier: number;
  style?: StyleProp<ViewStyle>;
  lighting?: BadgeLighting;
  spin?: SpinFeel;
}

/**
 * The spinning badge: the tier's body plus the family's mark, turned by
 * a horizontal drag only. A flick keeps it turning and it coasts to a
 * stop on its own, like a scroll. Lives inside the Filament scene so it
 * can hand the turn to the render thread.
 */
const Turntable = ({ family, tier, lighting, spin }: Required<Omit<Props, 'style'>>) => {
  const yaw = useSharedValue(0);
  const pan = Gesture.Pan()
    .activeOffsetX([-4, 4])
    .failOffsetY([-16, 16])
    .onChange(e => {
      'worklet';
      yaw.value += e.changeX * spin.radiansPerPoint;
    })
    .onEnd(e => {
      'worklet';
      yaw.value = withDecay({ velocity: e.velocityX * spin.radiansPerPoint, deceleration: spin.deceleration });
    });
  const rotation = useDerivedValue<[number, number, number]>(() => [0, yaw.value, 0]);
  const rotate = useSyncSharedValue(rotation);
  const overlay = badgeOverlayFor(family, tier);

  return (
    <GestureDetector gesture={pan}>
      <FilamentView style={{ flex: 1 }} enableTransparentRendering>
        {/* The model is one unit wide, front toward +Z; the camera sits on that axis. */}
        <Camera cameraPosition={[0, 0, 3.1]} cameraTarget={[0, 0, 0]} cameraUp={[0, 1, 0]} focalLengthInMillimeters={60} />
        <EnvironmentalLight source={{ uri: 'RNF_default_env_ibl.ktx' }} intensity={lighting.environment} />
        <Light type="directional" intensity={lighting.sun} colorKelvin={lighting.kelvin} direction={[-0.4, -0.7, -0.6]} castShadows={false} />
        <Model source={BADGE_BODIES[tier]} rotate={rotate} multiplyWithCurrentTransform={false} />
        {overlay !== undefined && <Model source={overlay} rotate={rotate} multiplyWithCurrentTransform={false} />}
      </FilamentView>
    </GestureDetector>
  );
};

export const Badge3D = ({ family, tier, style, lighting = DEFAULT_LIGHTING, spin = DEFAULT_SPIN }: Props) => (
  <View style={[{ width: 280, height: 280 }, style]}>
    <FilamentScene>
      <Turntable family={family} tier={Math.max(1, tier)} lighting={lighting} spin={spin} />
    </FilamentScene>
  </View>
);
