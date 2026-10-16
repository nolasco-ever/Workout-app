import React, { useEffect, useMemo, useState } from 'react';
import { View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import { AchievementUnlock } from '../../data/models';
import { CustomText } from '../text/customText';
import { useTheme } from '../../theme';
import { BadgeSvg } from './BadgeSvg';

/** How many badges drift at once: the newest ones. */
const MAX_SHOWN = 8;

/**
 * One badge drawing, drifting. Its place is spread around the pane from its
 * index; the drift is a slow figure of eight of a few points, so the cluster
 * breathes without ever wandering off.
 */
const Drifting = ({ unlock, index, count, box }: { unlock: AchievementUnlock; index: number; count: number; box: { width: number; height: number } }) => {
  const t = useSharedValue(0);
  useEffect(() => {
    t.value = withRepeat(withTiming(1, { duration: 9000 + index * 1300, easing: Easing.inOut(Easing.sin) }), -1, true);
  }, [t, index]);
  // Few badges sit large and close to the middle; more of them go smaller and further out, so the pane never has a hole in it.
  const base = count <= 2 ? 128 : count <= 4 ? 108 : 84;
  const size = base + ((index * 37) % 24);
  const angle = (index / Math.max(1, count)) * Math.PI * 2 + 0.6;
  const spread = count === 1 ? 0 : Math.min(0.34, 0.12 + count * 0.045) + ((index * 13) % 5) / 100;
  const cx = box.width / 2 + Math.cos(angle) * box.width * spread;
  const cy = box.height / 2 + Math.sin(angle) * box.height * spread;
  const style = useAnimatedStyle(() => ({
    transform: [{ translateX: Math.sin(t.value * Math.PI * 2 + index) * 14 }, { translateY: Math.cos(t.value * Math.PI * 2 + index * 1.7) * 18 }],
  }));
  return (
    <Animated.View style={[{ position: 'absolute', left: cx - size / 2, top: cy - size / 2 }, style]}>
      <BadgeSvg family={unlock.family} tier={unlock.tier} size={size} />
    </Animated.View>
  );
};

/**
 * The viewer pane with nothing chosen yet: the newest earned badges drift
 * slowly on the ground colour, as their drawings. (The 3D renderer is for the one badge
 * being looked at; on iOS each live badge is a renderer of its own.)
 */
export const FloatingBadges = ({ unlocks }: { unlocks: AchievementUnlock[] }) => {
  const { colors, spacing } = useTheme();
  const [box, setBox] = useState<{ width: number; height: number } | null>(null);
  const shown = useMemo(() => [...unlocks].sort((a, b) => b.unlockedAt - a.unlockedAt).slice(0, MAX_SHOWN), [unlocks]);
  return (
    <View style={{ flex: 1, backgroundColor: colors.ground, overflow: 'hidden' }} onLayout={e => setBox({ width: e.nativeEvent.layout.width, height: e.nativeEvent.layout.height })}>
      {box && shown.map((u, i) => <Drifting key={u.achievementId} unlock={u} index={i} count={shown.length} box={box} />)}
      {shown.length === 0 && (
        <View pointerEvents="none" style={{ position: 'absolute', left: 0, right: 0, bottom: spacing.xxl, alignItems: 'center' }}>
          <CustomText variant="caption" color={colors.inkMuted}>Your badges will gather here</CustomText>
        </View>
      )}
    </View>
  );
};
