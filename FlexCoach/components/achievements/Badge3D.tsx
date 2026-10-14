import React, { useEffect, useRef } from 'react';
import { StyleProp, View, ViewStyle } from 'react-native';
import { Camera, EnvironmentalLight, FilamentScene, FilamentView, Light, Model } from 'react-native-filament';
import { useSharedValue } from 'react-native-worklets-core';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
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

const REST = 0.00002; // radians per ms: below this a coasting badge is considered stopped

/**
 * The spinning badge: the tier's body plus the family's mark, turned by a
 * horizontal drag only. A flick keeps it turning and it coasts to a stop on
 * its own, like a scroll. The turn is integrated on the JS thread, frame by
 * frame, into a worklets-core shared value that Filament's render thread
 * reads; Reanimated stays out of the Filament tree because the two worklet
 * runtimes cannot share functions.
 */
const Turntable = ({ family, tier, lighting, spin }: Required<Omit<Props, 'style'>>) => {
  const rotate = useSharedValue<[number, number, number]>([0, 0, 0]);
  const yaw = useRef(0);
  const velocity = useRef(0); // radians per ms
  const frame = useRef<number | null>(null);
  const feel = useRef(spin);
  feel.current = spin;

  const stop = () => {
    if (frame.current !== null) cancelAnimationFrame(frame.current);
    frame.current = null;
  };
  const coast = () => {
    let last = Date.now();
    const step = () => {
      const now = Date.now();
      const dt = Math.min(48, now - last);
      last = now;
      velocity.current *= Math.pow(feel.current.deceleration, dt);
      yaw.current += velocity.current * dt;
      rotate.value = [0, yaw.current, 0];
      if (Math.abs(velocity.current) < REST) {
        velocity.current = 0;
        frame.current = null;
        return;
      }
      frame.current = requestAnimationFrame(step);
    };
    stop();
    frame.current = requestAnimationFrame(step);
  };
  useEffect(() => stop, []);

  const pan = Gesture.Pan()
    .runOnJS(true)
    .activeOffsetX([-4, 4])
    .failOffsetY([-16, 16])
    .onBegin(() => {
      stop();
      velocity.current = 0;
    })
    .onChange(e => {
      yaw.current += e.changeX * feel.current.radiansPerPoint;
      rotate.value = [0, yaw.current, 0];
    })
    .onEnd(e => {
      velocity.current = (e.velocityX * feel.current.radiansPerPoint) / 1000;
      if (Math.abs(velocity.current) >= REST) coast();
    });
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
