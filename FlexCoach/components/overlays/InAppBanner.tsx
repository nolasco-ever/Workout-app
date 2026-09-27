import React, { useEffect, useRef, useState } from 'react';
import { Pressable, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { Easing, runOnJS, useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { InAppBanner, subscribeInAppBanner } from '../../data/notifications/inAppBanner';
import { openTarget } from '../../data/notifications/openTarget';
import { CustomText } from '../text/customText';
import { Icon } from '../icons/Icon';
import { generalIcons } from '../icons/icon-library';
import { useTheme } from '../../theme';

const HIDDEN_Y = -160;
const SPRING = { damping: 18, stiffness: 240 };

/**
 * Hosts in-app banners: slides in under the status bar, stays a few
 * seconds, and goes with a tap (opening its target) or a flick upward.
 * Mount once at the app root, above the navigator.
 */
export const InAppBannerHost = () => {
  const { colors, spacing, radius } = useTheme();
  const insets = useSafeAreaInsets();
  const [banner, setBanner] = useState<InAppBanner | null>(null);
  const y = useSharedValue(HIDDEN_Y);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clear = () => setBanner(null);
  const hide = () => {
    'worklet';
    y.value = withTiming(HIDDEN_Y, { duration: 220, easing: Easing.in(Easing.cubic) }, done => {
      if (done) runOnJS(clear)();
    });
  };

  useEffect(
    () =>
      subscribeInAppBanner(next => {
        if (timer.current) clearTimeout(timer.current);
        setBanner(next);
        y.value = HIDDEN_Y;
        y.value = withSpring(0, SPRING);
        timer.current = setTimeout(() => hide(), next.durationMs ?? 6000);
      }),
    // Shared values are stable refs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const onPress = () => {
    if (timer.current) clearTimeout(timer.current);
    const target = banner?.target;
    hide();
    if (target) openTarget(target);
  };

  const pan = Gesture.Pan()
    .activeOffsetY([-6, 6])
    .onUpdate(e => {
      y.value = Math.min(12, e.translationY);
    })
    .onEnd(e => {
      if (e.translationY < -24 || e.velocityY < -500) hide();
      else y.value = withSpring(0, SPRING);
    });

  const style = useAnimatedStyle(() => ({ transform: [{ translateY: y.value }] }));

  if (!banner) return null;
  return (
    <View pointerEvents="box-none" style={{ position: 'absolute', top: 0, left: 0, right: 0 }}>
      <GestureDetector gesture={pan}>
        <Animated.View style={[{ paddingTop: insets.top + spacing.xs, paddingHorizontal: spacing.md }, style]}>
          <Pressable
            onPress={onPress}
            accessibilityRole="alert"
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: spacing.md,
              backgroundColor: colors.surfaceRaised,
              borderRadius: radius.lg,
              borderWidth: 1,
              borderColor: colors.line,
              padding: spacing.md,
              shadowColor: '#000',
              shadowOpacity: 0.18,
              shadowRadius: 12,
              shadowOffset: { width: 0, height: 6 },
              elevation: 8,
            }}
          >
            <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: colors.accentTint, alignItems: 'center', justifyContent: 'center' }}>
              <Icon icon={generalIcons.timer} color={colors.accent} size={20} />
            </View>
            <View style={{ flex: 1 }}>
              <CustomText variant="bodyStrong" numberOfLines={1}>{banner.title}</CustomText>
              <CustomText variant="caption" color={colors.inkMuted} numberOfLines={2}>{banner.body}</CustomText>
            </View>
          </Pressable>
        </Animated.View>
      </GestureDetector>
    </View>
  );
};
