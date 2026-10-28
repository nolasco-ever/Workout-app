import React, { useEffect, useRef } from 'react';
import { AccessibilityInfo, Animated, Easing, TouchableOpacity, View } from 'react-native';
import { CustomText } from '../../../../components/text/customText';
import { Icon } from '../../../../components/icons/Icon';
import { generalIcons } from '../../../../components/icons/icon-library';
import { useTheme } from '../../../../theme';

/**
 * Legacy Swap's way in, at the top of the Workout tab (v1 #6b, owner
 * 2026-10-26): a button with a soft glow so testers notice it, toned down
 * 2026-10-27. The glow breathes slowly; with Reduce Motion it holds still.
 */
export const LegacySwapButton = ({ onPress }: { onPress: () => void }) => {
  const { colors, spacing } = useTheme();
  const glow = useRef(new Animated.Value(0.4)).current;
  useEffect(() => {
    let loop: Animated.CompositeAnimation | null = null;
    let cancelled = false;
    AccessibilityInfo.isReduceMotionEnabled().then(reduce => {
      if (cancelled || reduce) return;
      loop = Animated.loop(
        Animated.sequence([
          Animated.timing(glow, { toValue: 0.7, duration: 1800, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
          Animated.timing(glow, { toValue: 0.3, duration: 1800, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        ]),
      );
      loop.start();
    });
    return () => {
      cancelled = true;
      loop?.stop();
    };
  }, [glow]);
  return (
    <View>
      {/* The glow: a soft halo behind the button, its shadow the accent. */}
      <Animated.View
        pointerEvents="none"
        style={{
          position: 'absolute',
          top: -2,
          bottom: -2,
          left: -2,
          right: -2,
          borderRadius: 28,
          backgroundColor: colors.accentTint,
          opacity: glow,
          shadowColor: colors.accent,
          shadowOpacity: 0.45,
          shadowRadius: 8,
          shadowOffset: { width: 0, height: 0 },
          elevation: 3,
        }}
      />
      <TouchableOpacity
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel="Legacy Swap"
        accessibilityHint="Swap an exercise the library update matched wrong, keeping its history"
        style={{ height: 52, borderRadius: 26, borderWidth: 1.5, borderColor: colors.accent, backgroundColor: colors.accentTint, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm }}
      >
        <Icon icon={generalIcons.swap} size={20} color={colors.accent} />
        <CustomText variant="label" color={colors.accent} style={{ fontSize: 16 }}>Legacy Swap</CustomText>
      </TouchableOpacity>
    </View>
  );
};
