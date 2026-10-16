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
  const size = 72 + ((index * 37) % 56);
  const angle = (index / Math.max(1, count)) * Math.PI * 2 + 0.6;
  const spread = 0.3 + ((index * 13) % 7) / 40;
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
 * slowly on black, as their drawings. (The 3D renderer is for the one badge
 * being looked at; on iOS each live badge is a renderer of its own.)
 */
export const FloatingBadges = ({ unlocks }: { unlocks: AchievementUnlock[] }) => {
  const { spacing } = useTheme();
  const [box, setBox] = useState<{ width: number; height: number } | null>(null);
  const shown = useMemo(() => [...unlocks].sort((a, b) => b.unlockedAt - a.unlockedAt).slice(0, MAX_SHOWN), [unlocks]);
  return (
    <View style={{ flex: 1, backgroundColor: '#000000', overflow: 'hidden' }} onLayout={e => setBox({ width: e.nativeEvent.layout.width, height: e.nativeEvent.layout.height })}>
      {box && shown.map((u, i) => <Drifting key={u.achievementId} unlock={u} index={i} count={shown.length} box={box} />)}
      <View pointerEvents="none" style={{ position: 'absolute', left: 0, right: 0, bottom: spacing.xxl, alignItems: 'center' }}>
        <CustomText variant="caption" color="rgba(255,255,255,0.5)">{shown.length ? 'Tap a badge to look at it' : 'Your badges will gather here'}</CustomText>
      </View>
    </View>
  );
};
