import React, { useEffect, useState } from 'react';
import { Modal, Pressable, TouchableOpacity, useWindowDimensions, View } from 'react-native';
import Animated, { Easing, runOnJS, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { REACTION_COLUMNS, REACTION_EMOJI } from '../../data/models';
import { CustomText } from '../text/customText';
import { useTheme } from '../../theme';

/** Where the button that opened the bubble sits, in window coordinates. */
export interface BubbleAnchor {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface Props {
  anchor: BubbleAnchor | null;
  /** The emoji I already gave, drawn selected. */
  mine: string | null;
  onPick: (emoji: string) => void;
  onClose: () => void;
}

const CELL = 44;
const PAD = 6;
/** The box's own border; width and height include it, so the cells must leave room for it. */
const BORDER = 1;
const COLS = Math.min(REACTION_COLUMNS, REACTION_EMOJI.length);
const ROWS = Math.ceil(REACTION_EMOJI.length / COLS);
const WIDTH = COLS * CELL + (PAD + BORDER) * 2;
const HEIGHT = ROWS * CELL + (PAD + BORDER) * 2;
const GAP = 8;
const OPEN_MS = 160;
const CLOSE_MS = 120;

/**
 * The emoji picker as a floating bubble above the button that opened it,
 * the set wrapped into rows of REACTION_COLUMNS. Grows out of the button's
 * spot and fades in; a tap anywhere else, or a
 * pick, shrinks it back and closes. Lives in a transparent modal so it
 * floats over cards and scroll views instead of being clipped by them.
 */
export const ReactionBubble = ({ anchor, mine, onPick, onClose }: Props) => {
  const { colors, spacing, radius } = useTheme();
  const { width: screenWidth } = useWindowDimensions();
  const [mounted, setMounted] = useState(anchor !== null);
  const progress = useSharedValue(0);

  const finish = () => {
    setMounted(false);
    onClose();
  };
  const close = () => {
    progress.value = withTiming(0, { duration: CLOSE_MS, easing: Easing.in(Easing.cubic) }, done => {
      if (done) runOnJS(finish)();
    });
  };

  useEffect(() => {
    if (anchor) {
      setMounted(true);
      progress.value = 0;
      progress.value = withTiming(1, { duration: OPEN_MS, easing: Easing.out(Easing.cubic) });
    }
    // progress is a stable shared value.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [anchor]);

  const style = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ scale: 0.6 + 0.4 * progress.value }],
  }));

  if (!mounted || !anchor) return null;
  const left = Math.min(Math.max(spacing.md, anchor.x + anchor.width / 2 - WIDTH / 2), screenWidth - WIDTH - spacing.md);
  const top = anchor.y - HEIGHT - GAP;
  // Scale from the point above the button, so it grows out of it.
  const originX = anchor.x + anchor.width / 2 - left;

  return (
    <Modal visible transparent animationType="none" onRequestClose={close} statusBarTranslucent navigationBarTranslucent>
      <Pressable onPress={close} accessibilityRole="button" accessibilityLabel="Close reactions" style={{ flex: 1 }}>
        <Animated.View
          style={[
            {
              position: 'absolute',
              left,
              top,
              width: WIDTH,
              height: HEIGHT,
              padding: PAD,
              flexDirection: 'row',
              flexWrap: 'wrap',
              borderRadius: ROWS > 1 ? radius.lg : radius.pill,
              backgroundColor: colors.surfaceRaised,
              borderWidth: BORDER,
              borderColor: colors.line,
              shadowColor: '#000',
              shadowOpacity: 0.25,
              shadowRadius: 14,
              shadowOffset: { width: 0, height: 8 },
              elevation: 10,
              transformOrigin: `${originX}px ${HEIGHT}px`,
            },
            style,
          ]}
        >
          {REACTION_EMOJI.map(emoji => (
            <TouchableOpacity
              key={emoji}
              onPress={() => onPick(emoji)}
              accessibilityRole="button"
              accessibilityLabel={mine === emoji ? `${emoji}, yours, tap to remove` : `React ${emoji}`}
              style={{ width: CELL, height: CELL, borderRadius: CELL / 2, alignItems: 'center', justifyContent: 'center', backgroundColor: mine === emoji ? colors.accentTint : colors.transparent }}
            >
              <CustomText variant="body" style={{ fontSize: 26, lineHeight: 32 }}>{emoji}</CustomText>
            </TouchableOpacity>
          ))}
        </Animated.View>
      </Pressable>
    </Modal>
  );
};
