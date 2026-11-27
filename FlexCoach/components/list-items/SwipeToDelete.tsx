import React, { useRef } from 'react';
import { Pressable, View } from 'react-native';
import ReanimatedSwipeable, { SwipeableMethods } from 'react-native-gesture-handler/ReanimatedSwipeable';
import Animated, { SharedValue, useAnimatedStyle } from 'react-native-reanimated';
import { CustomText } from '../text/customText';
import { Icon } from '../icons/Icon';
import { directionIcons, generalIcons } from '../icons/icon-library';
import { ColorTokens, useTheme } from '../../theme';

const ACTION_WIDTH = 88;

/**
 * What the swipe does: delete (red), or skip and unskip an exercise mid-workout (build 22), both neutral since
 * nothing is lost for good.
 */
export type SwipeKind = 'delete' | 'skip' | 'unskip';
const LOOK = {
  delete: { title: 'Delete', icon: generalIcons.trash, bg: (c: ColorTokens) => c.error, fg: () => '#FFFFFF' },
  skip: { title: 'Skip', icon: directionIcons.skip, bg: (c: ColorTokens) => c.surfaceRaised, fg: (c: ColorTokens) => c.ink },
  unskip: { title: 'Unskip', icon: directionIcons.unskip, bg: (c: ColorTokens) => c.selected, fg: (c: ColorTokens) => c.onSelected },
};

/** The action behind the row. Slides in with the drag instead of sitting still behind it. */
const SwipeAction = ({ translation, kind, label, onPress }: { translation: SharedValue<number>; kind: SwipeKind; label: string; onPress: () => void }) => {
  const { colors, spacing } = useTheme();
  const look = LOOK[kind];
  const style = useAnimatedStyle(() => ({ transform: [{ translateX: translation.value + ACTION_WIDTH }] }));
  return (
    <Animated.View style={[{ width: ACTION_WIDTH, backgroundColor: look.bg(colors) }, style]}>
      <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={label} style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.xs }}>
        <Icon icon={look.icon} size={20} color={look.fg(colors)} />
        <CustomText variant="caption" color={look.fg(colors)}>{look.title}</CustomText>
      </Pressable>
    </Animated.View>
  );
};

interface Props {
  children: React.ReactNode;
  onDelete: () => void;
  /** Read out by screen readers for the action. */
  label?: string;
  /** Delete unless said otherwise; `onDelete` runs for whichever it is. */
  kind?: SwipeKind;
  /** What the row paints over the action: the card's surface unless the row sits straight on the page. */
  background?: string;
}

/**
 * Wraps a list row so dragging it left reveals an action, delete unless
 * `kind` says skip or unskip. A full drag past the action, or a tap on it,
 * runs it. The row itself must paint its own background so the action
 * stays hidden until the drag starts.
 */
export const SwipeToDelete = ({ children, onDelete, label, kind = 'delete', background }: Props) => {
  const { colors } = useTheme();
  const ref = useRef<SwipeableMethods>(null);

  const renderRight = (_progress: SharedValue<number>, translation: SharedValue<number>) => (
    <SwipeAction
      translation={translation}
      kind={kind}
      label={label ?? LOOK[kind].title}
      onPress={() => {
        ref.current?.close();
        onDelete();
      }}
    />
  );

  return (
    <ReanimatedSwipeable
      ref={ref}
      friction={1.6}
      rightThreshold={ACTION_WIDTH * 0.6}
      overshootRight={false}
      renderRightActions={renderRight}
      onSwipeableOpen={direction => {
        if (direction === 'right') onDelete();
      }}
    >
      <View style={{ backgroundColor: background ?? colors.surface }}>{children}</View>
    </ReanimatedSwipeable>
  );
};
