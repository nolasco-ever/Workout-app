import React, { useEffect, useState } from 'react';
import { TouchableOpacity, View } from 'react-native';
import Animated, { Easing, runOnJS, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { CustomText } from '../../../../components/text/customText';
import { Icon } from '../../../../components/icons/Icon';
import { directionIcons, generalIcons } from '../../../../components/icons/icon-library';
import { formatDuration } from '../../../../data/engine/units';
import { useTheme } from '../../../../theme';

/** Re-renders once a second while mounted. */
const useTick = (intervalMs: number) => {
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
};

/**
 * Header title: the workout's name with how long it has been running
 * underneath. With `onPress` it is a button (a small chevron says so) that
 * opens the exercise list.
 */
export const SessionTitle = ({ name, startedAt, onPress }: { name: string; startedAt: number; onPress?: () => void }) => {
  const { colors, spacing } = useTheme();
  useTick(1000);
  const elapsed = Math.max(0, Math.round((Date.now() - startedAt) / 1000));
  return (
    <TouchableOpacity onPress={onPress} disabled={!onPress} hitSlop={8} accessibilityRole={onPress ? 'button' : undefined} accessibilityLabel={onPress ? `${name}, show exercises` : undefined} style={{ alignItems: 'center', paddingHorizontal: spacing.md }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
        <CustomText variant="bodyStrong" numberOfLines={1}>{name}</CustomText>
        {onPress && <Icon icon={directionIcons.angleDown} size={14} color={colors.inkMuted} strokeWidth={2.5} />}
      </View>
      <CustomText variant="caption" color={colors.inkMuted} style={{ fontVariant: ['tabular-nums'] }}>
        {formatDuration(elapsed)}
      </CustomText>
    </TouchableOpacity>
  );
};

/** How long the green check stays before the pill folds away. */
const DONE_LINGER_MS = 1200;

/**
 * The rest countdown as a pill in the header row: "Rest", the time left,
 * and a double chevron that says "tap to skip". It unfolds from the right
 * when a rest starts; when the rest is over it turns green with a check,
 * then folds away. A tap folds it at once.
 */
export const RestPill = ({ startedAt, durationSec, onDismiss }: { startedAt: number | null; durationSec: number; onDismiss: () => void }) => {
  const { colors, spacing, radius } = useTheme();
  useTick(250);
  const remaining = startedAt === null ? durationSec : Math.max(0, Math.round(durationSec - (Date.now() - startedAt) / 1000));
  const done = startedAt !== null && remaining <= 0;

  // Starts folded so the first rest unfolds too, not only the ones after it.
  const open = useSharedValue(0);
  const [folding, setFolding] = useState(false);
  const fold = () => {
    if (folding) return;
    setFolding(true);
    open.value = withTiming(0, { duration: 200, easing: Easing.in(Easing.cubic) }, finished => {
      if (finished) runOnJS(onDismiss)();
    });
  };
  const foldRef = React.useRef(fold);
  foldRef.current = fold;

  useEffect(() => {
    if (!done) return;
    const id = setTimeout(() => foldRef.current(), DONE_LINGER_MS);
    return () => clearTimeout(id);
  }, [done]);
  // A new rest reuses the mounted pill: open it back up.
  useEffect(() => {
    if (startedAt === null) return;
    setFolding(false);
    open.value = withTiming(1, { duration: 180, easing: Easing.out(Easing.cubic) });
    // open is a stable shared value.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startedAt]);

  const style = useAnimatedStyle(() => ({ transform: [{ scaleX: open.value }], opacity: open.value }));
  if (startedAt === null) return null;
  const tone = done ? colors.success : colors.accent;

  return (
    <Animated.View style={[{ transformOrigin: 'right center' }, style]}>
      <TouchableOpacity
        onPress={fold}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel={done ? 'Rest over, dismiss' : `Rest, ${remaining} seconds left. Skip`}
        style={{ flexDirection: 'row', alignItems: 'center', gap: 2, height: 36, paddingLeft: spacing.md, paddingRight: spacing.sm, borderRadius: radius.pill, backgroundColor: done ? colors.successTint : colors.accentTint, justifyContent: 'center' }}
      >
        {done ? (
          <>
            <CustomText variant="label" color={tone}>Rest</CustomText>
            <Icon icon={generalIcons.check} size={16} color={tone} strokeWidth={3} style={{ marginLeft: 2 }} />
          </>
        ) : (
          <>
            <CustomText variant="label" color={tone}>Rest</CustomText>
            <CustomText variant="label" color={tone} style={{ fontVariant: ['tabular-nums'], marginLeft: 4 }}>
              {remaining >= 60 ? formatDuration(remaining) : `${remaining}s`}
            </CustomText>
            <Icon icon={directionIcons.skip} size={20} color={tone} strokeWidth={2.5} />
          </>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};
