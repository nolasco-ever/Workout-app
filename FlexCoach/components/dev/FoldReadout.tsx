import React from 'react';
import { Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFold } from '../../data/fold/useFold';
import NativeFold from '../../specs/NativeFold';

const rect = (r: { x: number; y: number; width: number; height: number } | undefined): string => (r ? `${Math.round(r.x)},${Math.round(r.y)} ${Math.round(r.width)}×${Math.round(r.height)}` : '–');

/**
 * What the fold module reports, in a corner of the screen. Development only,
 * behind devFlags.showFoldReadout, for checking the module on a folding
 * phone or its simulator pose by pose.
 */
export const FoldReadout = () => {
  const f = useFold();
  const insets = useSafeAreaInsets();
  const lines = [
    `module ${NativeFold ? 'present' : 'ABSENT (native build is stale)'}`,
    `posture ${f.posture}${f.foldable ? '' : ' (not foldable)'}`,
    `hinge ${f.hinge.status}${f.hinge.angleDeg === null ? '' : ` ${f.hinge.angleDeg}°`}`,
    `fold ${f.fold ? `${f.fold.axis} ${rect(f.fold.rect)}${f.fold.active ? ' active' : ''}` : '–'}`,
    `halves ${rect(f.halves?.[0])} | ${rect(f.halves?.[1])}`,
    `window ${Math.round(f.window.width)}×${Math.round(f.window.height)}  insets t${insets.top} r${insets.right} b${insets.bottom} l${insets.left}`,
  ];
  return (
    <View pointerEvents="none" style={{ position: 'absolute', left: insets.left + 8, bottom: insets.bottom + 8, padding: 6, borderRadius: 6, backgroundColor: 'rgba(0,0,0,0.75)' }}>
      {lines.map(l => (
        <Text key={l} style={{ color: '#9FE870', fontFamily: 'Menlo', fontSize: 10 }}>{l}</Text>
      ))}
    </View>
  );
};
