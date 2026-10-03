import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Modal, PanResponder, ScrollView, TouchableOpacity, TouchableWithoutFeedback, useWindowDimensions, View } from 'react-native';
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
const DISMISS_VELOCITY = 0.8;

/**
 * A sheet that slides up over the current screen with a scrim behind it.
 * Tapping the scrim or the close button dismisses it, and so does dragging
 * it down by its handle or title, or pulling the content down past its
 * top. Content scrolls if it is taller than the sheet's maximum height.
 *
 * The scrim fades while the sheet slides: with the Modal's own slide
 * animation the scrim rode up with the sheet and its top edge was visible.
 */
export const BottomSheet = ({ open, title, onClose, children, footer, headerRight }: Props) => {
  const { colors, spacing, radius } = useTheme();
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const [mounted, setMounted] = useState(open);
  const [sheetHeight, setSheetHeight] = useState(windowHeight);
  const progress = useRef(new Animated.Value(0)).current;
  const dragY = useRef(new Animated.Value(0)).current;
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (open) {
      setMounted(true);
      dragY.setValue(0);
      Animated.timing(progress, { toValue: 1, duration: 280, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
    } else {
      Animated.timing(progress, { toValue: 0, duration: 220, easing: Easing.in(Easing.cubic), useNativeDriver: true }).start(({ finished }) => {
        if (finished) setMounted(false);
      });
    }
  }, [open, progress, dragY]);

  // Dragging the handle or the title row pulls the sheet down with the
  // finger; past the threshold it goes, otherwise it springs back.
  const pan = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => g.dy > 4 && Math.abs(g.dy) > Math.abs(g.dx),
      onPanResponderMove: (_, g) => dragY.setValue(Math.max(0, g.dy)),
      onPanResponderRelease: (_, g) => {
        if (g.dy > DISMISS_DISTANCE || g.vy > DISMISS_VELOCITY) onCloseRef.current();
        else Animated.spring(dragY, { toValue: 0, useNativeDriver: true, damping: 20, stiffness: 220 }).start();
      },
      onPanResponderTerminate: () => Animated.spring(dragY, { toValue: 0, useNativeDriver: true, damping: 20, stiffness: 220 }).start(),
    }),
  ).current;

  const slide = progress.interpolate({ inputRange: [0, 1], outputRange: [sheetHeight, 0] });
  const translateY = Animated.add(slide, dragY);

  const body = (
    <View style={{ flex: 1, justifyContent: 'flex-end' }}>
      <TouchableWithoutFeedback onPress={onClose} accessibilityLabel="Close">
        <Animated.View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: colors.scrim, opacity: progress }} />
      </TouchableWithoutFeedback>
      <Animated.View
        onLayout={e => setSheetHeight(e.nativeEvent.layout.height)}
        style={{ maxHeight: '85%', backgroundColor: colors.surface, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, paddingBottom: insets.bottom + spacing.md, transform: [{ translateY }] }}
      >
        <View {...pan.panHandlers}>
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
        <ScrollView
          contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingBottom: spacing.md, gap: spacing.lg }}
          keyboardShouldPersistTaps="handled"
          // Pulling the content down past its top (the iOS bounce) also puts the sheet away.
          onScrollEndDrag={e => {
            if (e.nativeEvent.contentOffset.y < -60) onClose();
          }}
        >
          {children}
        </ScrollView>
        {footer && <View style={{ paddingHorizontal: spacing.lg, paddingTop: spacing.md, borderTopWidth: 1, borderTopColor: colors.line }}>{footer}</View>}
      </Animated.View>
    </View>
  );

  return (
    <Modal visible={mounted} transparent animationType="none" onRequestClose={onClose} statusBarTranslucent>
      {body}
    </Modal>
  );
};
