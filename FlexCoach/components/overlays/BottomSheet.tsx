import React, { useEffect, useRef, useState } from 'react';
import { Modal, NativeScrollEvent, NativeSyntheticEvent, TouchableOpacity, TouchableWithoutFeedback, useWindowDimensions, View } from 'react-native';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, { Easing, runOnJS, useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CustomText } from '../text/customText';
import { Icon } from '../icons/Icon';
import { generalIcons } from '../icons/icon-library';
import { useTheme } from '../../theme';

interface Props {
  open: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  /** Optional bar pinned under the scrolling content, e.g. action buttons. */
  footer?: React.ReactNode;
  /** Replaces the close button at the right of the title; the scrim and a swipe down still close the sheet. */
  headerRight?: React.ReactNode;
}

/** Drag distance or fling speed that counts as "put it away". */
const DISMISS_DISTANCE = 100;
const DISMISS_VELOCITY = 800;
const SPRING = { damping: 20, stiffness: 220 };

/**
 * A sheet that slides up over the current screen with a scrim behind it.
 * Tapping the scrim or the close button dismisses it, and so does dragging
 * it down: by its handle or title, by its content when that fits, or by
 * pulling scrolling content down once it is at the top. Content scrolls
 * if it is taller than the sheet's maximum height.
 *
 * The drag is a native gesture (gesture-handler + Reanimated), not a
 * PanResponder: the JS responder system was losing the drag inside the
 * Modal on devices, so the swipe never took.
 */
export const BottomSheet = ({ open, title, onClose, children, footer, headerRight }: Props) => {
  const { colors, spacing, radius } = useTheme();
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const [mounted, setMounted] = useState(open);
  const sheetHeight = useSharedValue(windowHeight);
  // Content only scrolls when it is taller than the room the sheet can give
  // it; a sheet whose content fits stays put, and dragging its content pulls
  // the sheet down like the handle does.
  const [contentHeight, setContentHeight] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(0);
  const scrolls = contentHeight > viewportHeight + 1;
  /** 0 = off screen, 1 = fully up. */
  const progress = useSharedValue(0);
  /** The live drag, in points below the resting position. */
  const dragY = useSharedValue(0);
  /** Where the content is scrolled to, so a pull only moves the sheet from the top. */
  const scrollY = useSharedValue(0);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (open) {
      setMounted(true);
      dragY.value = 0;
      progress.value = withTiming(1, { duration: 280, easing: Easing.out(Easing.cubic) });
    } else {
      progress.value = withTiming(0, { duration: 220, easing: Easing.in(Easing.cubic) }, finished => {
        if (finished) runOnJS(setMounted)(false);
      });
    }
  }, [open, progress, dragY]);

  const close = () => onCloseRef.current();

  // The handle and title row: any downward drag moves the sheet.
  const handlePan = Gesture.Pan()
    .activeOffsetY(6)
    .failOffsetX([-16, 16])
    .onUpdate(e => {
      dragY.value = Math.max(0, e.translationY);
    })
    .onEnd(e => {
      if (e.translationY > DISMISS_DISTANCE || e.velocityY > DISMISS_VELOCITY) runOnJS(close)();
      else dragY.value = withSpring(0, SPRING);
    })
    .onFinalize((_, success) => {
      if (!success) dragY.value = withSpring(0, SPRING);
    });

  // The content: the same drag, but when the content scrolls it only moves
  // the sheet from the top of the scroll, and runs alongside the scroll so
  // moving back up hands over to scrolling again.
  const scrollGesture = Gesture.Native();
  const atTopAtStart = useSharedValue(true);
  const contentPan = Gesture.Pan()
    .activeOffsetY(6)
    .failOffsetX([-16, 16])
    .simultaneousWithExternalGesture(scrollGesture)
    .onBegin(() => {
      atTopAtStart.value = scrollY.value <= 1;
    })
    .onUpdate(e => {
      if (!atTopAtStart.value) return;
      dragY.value = Math.max(0, e.translationY);
    })
    .onEnd(e => {
      if (!atTopAtStart.value) return;
      if (e.translationY > DISMISS_DISTANCE || e.velocityY > DISMISS_VELOCITY) runOnJS(close)();
      else dragY.value = withSpring(0, SPRING);
    })
    .onFinalize((_, success) => {
      if (!success) dragY.value = withSpring(0, SPRING);
    });

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    scrollY.value = e.nativeEvent.contentOffset.y;
  };

  const scrimStyle = useAnimatedStyle(() => ({ opacity: progress.value }));
  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: (1 - progress.value) * sheetHeight.value + dragY.value }],
  }));

  return (
    <Modal visible={mounted} transparent animationType="none" onRequestClose={onClose} statusBarTranslucent>
      {/* Gestures inside a Modal need their own root on Android. */}
      <GestureHandlerRootView style={{ flex: 1 }}>
        <View style={{ flex: 1, justifyContent: 'flex-end' }}>
          <TouchableWithoutFeedback onPress={onClose} accessibilityLabel="Close">
            <Animated.View style={[{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: colors.scrim }, scrimStyle]} />
          </TouchableWithoutFeedback>
          <Animated.View
            onLayout={e => {
              sheetHeight.value = e.nativeEvent.layout.height;
            }}
            style={[{ maxHeight: '85%', backgroundColor: colors.surface, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, paddingBottom: insets.bottom + spacing.md }, sheetStyle]}
          >
            <GestureDetector gesture={handlePan}>
              {/* collapsable={false}: Android flattens a plain View away, and a flattened view gets no touches. */}
              <View collapsable={false}>
                <View style={{ alignItems: 'center', paddingTop: spacing.sm }}>
                  <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: colors.line }} />
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingVertical: spacing.md }}>
                  <CustomText variant="heading">{title}</CustomText>
                  {headerRight ?? (
                    <TouchableOpacity onPress={onClose} hitSlop={10} accessibilityRole="button" accessibilityLabel="Close" style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: colors.surfaceRaised, alignItems: 'center', justifyContent: 'center' }}>
                      <Icon icon={generalIcons.xMark} size={18} color={colors.ink} />
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            </GestureDetector>
            <GestureDetector gesture={contentPan}>
              <View collapsable={false} style={{ flexShrink: 1 }}>
                <GestureDetector gesture={scrollGesture}>
                  <Animated.ScrollView
                    style={{ flexGrow: 0 }}
                    contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingBottom: spacing.md, gap: spacing.lg }}
                    keyboardShouldPersistTaps="handled"
                    scrollEnabled={scrolls}
                    // No bounce at the top: the pull moves the sheet instead.
                    bounces={false}
                    overScrollMode="never"
                    alwaysBounceVertical={false}
                    scrollEventThrottle={16}
                    onScroll={onScroll}
                    onContentSizeChange={(_, h) => setContentHeight(h)}
                    onLayout={e => setViewportHeight(e.nativeEvent.layout.height)}
                  >
                    {children}
                  </Animated.ScrollView>
                </GestureDetector>
              </View>
            </GestureDetector>
            {footer && <View style={{ paddingHorizontal: spacing.lg, paddingTop: spacing.md, borderTopWidth: 1, borderTopColor: colors.line }}>{footer}</View>}
          </Animated.View>
        </View>
      </GestureHandlerRootView>
    </Modal>
  );
};
