import React, { useRef } from 'react';
import { Pressable, View } from 'react-native';
import ReanimatedSwipeable, { SwipeableMethods } from 'react-native-gesture-handler/ReanimatedSwipeable';
import Animated, { SharedValue, useAnimatedStyle } from 'react-native-reanimated';
import { CustomText } from '../text/customText';
import { Icon } from '../icons/Icon';
import { generalIcons } from '../icons/icon-library';
import { useTheme } from '../../theme';

const ACTION_WIDTH = 88;

/** The red action behind the row. Slides in with the drag instead of sitting still behind it. */
const DeleteAction = ({ translation, label, onPress }: { translation: SharedValue<number>; label: string; onPress: () => void }) => {
  const { colors, spacing } = useTheme();
  const style = useAnimatedStyle(() => ({ transform: [{ translateX: translation.value + ACTION_WIDTH }] }));
  return (
    <Animated.View style={[{ width: ACTION_WIDTH, backgroundColor: colors.error }, style]}>
      <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={label} style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.xs }}>
        <Icon icon={generalIcons.trash} size={20} color="#FFFFFF" />
        <CustomText variant="caption" color="#FFFFFF">Delete</CustomText>
      </Pressable>
    </Animated.View>
  );
};

interface Props {
  children: React.ReactNode;
  onDelete: () => void;
  /** Read out by screen readers for the delete action. */
  label?: string;
}

/**
 * Wraps a list row so dragging it left reveals a delete action. A full
 * drag past the action, or a tap on it, deletes. The row itself must paint
 * its own background so the action stays hidden until the drag starts.
 */
export const SwipeToDelete = ({ children, onDelete, label = 'Delete' }: Props) => {
  const { colors } = useTheme();
  const ref = useRef<SwipeableMethods>(null);

  const renderRight = (_progress: SharedValue<number>, translation: SharedValue<number>) => (
    <DeleteAction
      translation={translation}
      label={label}
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
      <View style={{ backgroundColor: colors.surface }}>{children}</View>
    </ReanimatedSwipeable>
  );
};
