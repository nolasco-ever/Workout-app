import React, { useEffect, useRef, useState } from 'react';
import { Modal, StatusBar, TouchableOpacity, useWindowDimensions, View } from 'react-native';
import { Gesture, GestureDetector, ScrollView } from 'react-native-gesture-handler';
import Animated, { Easing, runOnJS, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CustomText } from '../text/customText';
import { Icon } from '../icons/Icon';
import { generalIcons } from '../icons/icon-library';
import { useTheme } from '../../theme';

interface Props {
  /** Image URIs, in order. */
  images: string[];
  /** Caption per image, same order. */
  captions?: string[];
  /** Index to open on; null keeps the viewer closed. */
  index: number | null;
  onClose: () => void;
}

const MAX_ZOOM = 4;
const DOUBLE_TAP_ZOOM = 2.5;
/** Drag distance or fling speed that counts as "put it away". */
const DISMISS_DISTANCE = 120;
const DISMISS_VELOCITY = 900;
/** How the photo settles after a gesture: a short ease, no bounce. */
const SETTLE = { duration: 220, easing: Easing.out(Easing.cubic) };
/** The photo's box is this much of the screen height; the bounds of a zoomed photo come from it. */
const PHOTO_HEIGHT = 0.7;

/**
 * Full-screen photo viewer: swipe between photos, pinch or double-tap to
 * zoom, tap to close, or drag the photo up or down to throw it away. The
 * backdrop fades as the photo moves. Zoom resets when the page changes.
 *
 * The pinch zooms around the fingers and follows them, so the photo can be
 * zoomed and moved in one gesture; a one-finger drag pans a zoomed photo
 * and, at 1x, is the dismissal. Two fingers never dismiss.
 */
export const PhotoViewer = ({ images, captions = [], index, onClose }: Props) => {
  const { colors, spacing, radius } = useTheme();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const pager = useRef<React.ComponentRef<typeof ScrollView>>(null);
  const [page, setPage] = useState(index ?? 0);
  // The current page for the scroll callbacks, which can hold a stale `page`.
  const pageRef = useRef(index ?? 0);
  // Mirrors the zoom on the JS side so the pager and the dismiss drag can be
  // switched off while zoomed in.
  const [zoomed, setZoomed] = useState(false);
  // A pinch's fingers also move sideways, and the pager would take that as
  // a scroll, snap back a moment later and reset the zoom on "page change".
  // So the pager is frozen while a pinch is in progress.
  const [pinching, setPinching] = useState(false);
  const open = index !== null;

  const scale = useSharedValue(1);
  const panX = useSharedValue(0);
  const panY = useSharedValue(0);
  /** Where the current gesture started from. */
  const startScale = useSharedValue(1);
  const startPanX = useSharedValue(0);
  const startPanY = useSharedValue(0);
  const startFocalX = useSharedValue(0);
  const startFocalY = useSharedValue(0);
  /** Vertical offset of the dismiss drag; separate from panning a zoomed photo. */
  const dragY = useSharedValue(0);
  const closing = useSharedValue(false);

  /** How far a photo at scale `s` may be panned before its edge leaves the screen edge. */
  const bound = (s: number, size: number) => {
    'worklet';
    return Math.max(0, ((s - 1) * size) / 2);
  };

  /** Ease the pan back inside the photo's bounds at the current scale. */
  const settleInBounds = () => {
    'worklet';
    const bx = bound(scale.value, width);
    const by = bound(scale.value, height * PHOTO_HEIGHT);
    const x = Math.min(bx, Math.max(-bx, panX.value));
    const y = Math.min(by, Math.max(-by, panY.value));
    if (x !== panX.value) panX.value = withTiming(x, SETTLE);
    if (y !== panY.value) panY.value = withTiming(y, SETTLE);
  };

  const resetZoom = () => {
    'worklet';
    scale.value = withTiming(1, SETTLE);
    panX.value = withTiming(0, SETTLE);
    panY.value = withTiming(0, SETTLE);
  };

  /** Zoom to `s` keeping the content under the screen point (fx, fy) in place; `from*` describe the gesture's start. */
  const zoomAbout = (s: number, fx: number, fy: number, fromScale: number, fromPanX: number, fromPanY: number, fromFx: number, fromFy: number) => {
    'worklet';
    // Positions are relative to the photo's centre, where the scale is applied.
    const cx = width / 2;
    const cy = height / 2;
    const contentX = (fromFx - cx - fromPanX) / fromScale;
    const contentY = (fromFy - cy - fromPanY) / fromScale;
    scale.value = s;
    panX.value = fx - cx - s * contentX;
    panY.value = fy - cy - s * contentY;
  };

  useEffect(() => {
    if (index === null) return;
    setPage(index);
    pageRef.current = index;
    setZoomed(false);
    setPinching(false);
    scale.value = 1;
    panX.value = 0;
    panY.value = 0;
    dragY.value = 0;
    closing.value = false;
    // Jump to the requested page once the modal has laid out.
    const id = setTimeout(() => pager.current?.scrollTo({ x: index * width, animated: false }), 0);
    return () => clearTimeout(id);
    // Shared values are stable refs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, width]);

  const onPageChange = (x: number) => {
    const next = Math.round(x / width);
    if (next !== pageRef.current) {
      pageRef.current = next;
      resetZoom();
      setZoomed(false);
      setPage(next);
    }
  };

  /** Put the pager back on its page after a pinch may have nudged it. */
  const settlePager = () => {
    setPinching(false);
    pager.current?.scrollTo({ x: pageRef.current * width, animated: true });
  };

  const finish = () => {
    'worklet';
    if (closing.value) return;
    closing.value = true;
    runOnJS(onClose)();
  };

  // The pinch: zoom around the fingers, and follow them as they move, so a
  // pinch is also a pan. Letting go under 1x eases back to 1x.
  const pinch = Gesture.Pinch()
    .onBegin(() => {
      runOnJS(setPinching)(true);
    })
    .onStart(e => {
      startScale.value = scale.value;
      startPanX.value = panX.value;
      startPanY.value = panY.value;
      startFocalX.value = e.focalX;
      startFocalY.value = e.focalY;
    })
    .onUpdate(e => {
      const s = Math.min(MAX_ZOOM, Math.max(0.7, startScale.value * e.scale));
      zoomAbout(s, e.focalX, e.focalY, startScale.value, startPanX.value, startPanY.value, startFocalX.value, startFocalY.value);
    })
    .onEnd(() => {
      if (scale.value <= 1.02) {
        resetZoom();
        runOnJS(setZoomed)(false);
      } else {
        settleInBounds();
        runOnJS(setZoomed)(true);
      }
    })
    .onFinalize(() => {
      runOnJS(settlePager)();
    });

  // One finger only. Zoomed: any drag pans the photo. At 1x: a mostly
  // vertical drag moves the photo towards dismissal, a horizontal one is
  // left to the pager.
  const basePan = Gesture.Pan().maxPointers(1);
  const pan = (zoomed ? basePan.activeOffsetY([-4, 4]).activeOffsetX([-4, 4]) : basePan.activeOffsetY([-14, 14]).failOffsetX([-14, 14]))
    .onStart(() => {
      startPanX.value = panX.value;
      startPanY.value = panY.value;
    })
    .onUpdate(e => {
      if (scale.value > 1) {
        panX.value = startPanX.value + e.translationX;
        panY.value = startPanY.value + e.translationY;
      } else {
        dragY.value = e.translationY;
      }
    })
    .onEnd(e => {
      if (scale.value > 1) {
        settleInBounds();
        return;
      }
      const thrown = Math.abs(e.translationY) > DISMISS_DISTANCE || Math.abs(e.velocityY) > DISMISS_VELOCITY;
      if (thrown) {
        const direction = e.translationY < 0 || (e.translationY === 0 && e.velocityY < 0) ? -1 : 1;
        dragY.value = withTiming(direction * height, { duration: 220, easing: Easing.in(Easing.cubic) }, done => {
          if (done) finish();
        });
      } else {
        dragY.value = withTiming(0, SETTLE);
      }
    })
    .onFinalize((_, success) => {
      // A pan that was cancelled (the pinch took over) leaves nothing half-dragged behind.
      if (!success && scale.value <= 1) dragY.value = withTiming(0, SETTLE);
    });

  // Double tap zooms in around the tap, or back out.
  const doubleTap = Gesture.Tap()
    .numberOfTaps(2)
    .maxDuration(300)
    .onEnd(e => {
      if (scale.value > 1) {
        resetZoom();
        runOnJS(setZoomed)(false);
      } else {
        const cx = width / 2;
        const cy = height / 2;
        scale.value = withTiming(DOUBLE_TAP_ZOOM, SETTLE);
        const bx = bound(DOUBLE_TAP_ZOOM, width);
        const by = bound(DOUBLE_TAP_ZOOM, height * PHOTO_HEIGHT);
        panX.value = withTiming(Math.min(bx, Math.max(-bx, (cx - e.x) * (DOUBLE_TAP_ZOOM - 1))), SETTLE);
        panY.value = withTiming(Math.min(by, Math.max(-by, (cy - e.y) * (DOUBLE_TAP_ZOOM - 1))), SETTLE);
        runOnJS(setZoomed)(true);
      }
    });
  const singleTap = Gesture.Tap()
    .maxDuration(250)
    .onEnd(() => {
      finish();
    });

  const gesture = Gesture.Simultaneous(pinch, pan, Gesture.Exclusive(doubleTap, singleTap));

  const photoStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: panX.value }, { translateY: panY.value + dragY.value }, { scale: scale.value }],
  }));
  const backdropStyle = useAnimatedStyle(() => ({
    opacity: 1 - Math.min(0.85, Math.abs(dragY.value) / (DISMISS_DISTANCE * 2.5)),
  }));
  const chromeStyle = useAnimatedStyle(() => ({
    opacity: 1 - Math.min(1, Math.abs(dragY.value) / DISMISS_DISTANCE),
  }));

  return (
    <Modal visible={open} transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <StatusBar barStyle="light-content" />
      <View style={{ flex: 1 }}>
        <Animated.View style={[{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#000' }, backdropStyle]} />
        <GestureDetector gesture={gesture}>
          <ScrollView
            ref={pager}
            horizontal
            pagingEnabled
            scrollEnabled={!zoomed && !pinching && images.length > 1}
            bounces={false}
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={e => onPageChange(e.nativeEvent.contentOffset.x)}
          >
            {/* Only the page on screen takes the zoom and drag transforms; the others sit still behind it. */}
            {images.map((uri, i) => (
              <View key={uri} style={{ width, height, justifyContent: 'center' }}>
                <Animated.Image source={{ uri }} resizeMode="contain" style={[{ width, height: height * PHOTO_HEIGHT }, i === page ? photoStyle : null]} />
              </View>
            ))}
          </ScrollView>
        </GestureDetector>

        {/* Close button: top right, except when the right edge is a folding phone's status column; then it takes the free top-left corner instead of hugging the column. */}
        <Animated.View style={[{ position: 'absolute', top: Math.max(insets.top, spacing.md) + spacing.sm }, insets.right > 0 ? { left: insets.left + spacing.lg } : { right: spacing.lg }, chromeStyle]}>
          <TouchableOpacity
            onPress={onClose}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel="Close"
            style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' }}
          >
            <Icon icon={generalIcons.xMark} size={22} color="#FFFFFF" />
          </TouchableOpacity>
        </Animated.View>

        {/* Caption and page dots */}
        <Animated.View pointerEvents="none" style={[{ position: 'absolute', left: insets.left, right: insets.right, bottom: insets.bottom + spacing.xl, alignItems: 'center', gap: spacing.md }, chromeStyle]}>
          {captions[page] ? (
            <View style={{ backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: spacing.xs }}>
              <CustomText variant="label" color="#FFFFFF">{captions[page]}</CustomText>
            </View>
          ) : null}
          {images.length > 1 && (
            <View style={{ flexDirection: 'row', gap: spacing.sm }}>
              {images.map((uri, i) => (
                <View key={uri} style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: i === page ? colors.accent : 'rgba(255,255,255,0.4)' }} />
              ))}
            </View>
          )}
        </Animated.View>
      </View>
    </Modal>
  );
};
