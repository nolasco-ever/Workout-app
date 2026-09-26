import React, { useEffect, useRef, useState } from 'react';
import { Modal, StatusBar, TouchableOpacity, useWindowDimensions, View } from 'react-native';
import { Gesture, GestureDetector, ScrollView } from 'react-native-gesture-handler';
import Animated, { Easing, runOnJS, useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
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
/** Drag distance or fling speed that counts as "put it away". */
const DISMISS_DISTANCE = 120;
const DISMISS_VELOCITY = 900;
const SPRING = { damping: 18, stiffness: 220 };

/**
 * Full-screen photo viewer: swipe between photos, pinch or double-tap to
 * zoom, tap to close, or drag the photo up or down to throw it away. The
 * backdrop fades as the photo moves. Zoom resets when the page changes.
 */
export const PhotoViewer = ({ images, captions = [], index, onClose }: Props) => {
  const { colors, spacing, radius } = useTheme();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const pager = useRef<React.ComponentRef<typeof ScrollView>>(null);
  const [page, setPage] = useState(index ?? 0);
  // Mirrors the zoom on the JS side so the pager and the dismiss drag can be
  // switched off while zoomed in.
  const [zoomed, setZoomed] = useState(false);
  const open = index !== null;

  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const panX = useSharedValue(0);
  const panY = useSharedValue(0);
  const savedPanX = useSharedValue(0);
  const savedPanY = useSharedValue(0);
  /** Vertical offset of the dismiss drag; separate from panning a zoomed photo. */
  const dragY = useSharedValue(0);
  const closing = useSharedValue(false);

  const resetZoom = () => {
    'worklet';
    scale.value = withSpring(1, SPRING);
    savedScale.value = 1;
    panX.value = withSpring(0, SPRING);
    panY.value = withSpring(0, SPRING);
    savedPanX.value = 0;
    savedPanY.value = 0;
  };

  useEffect(() => {
    if (index === null) return;
    setPage(index);
    setZoomed(false);
    scale.value = 1;
    savedScale.value = 1;
    panX.value = 0;
    panY.value = 0;
    savedPanX.value = 0;
    savedPanY.value = 0;
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
    if (next !== page) {
      resetZoom();
      setZoomed(false);
      setPage(next);
    }
  };

  const finish = () => {
    'worklet';
    if (closing.value) return;
    closing.value = true;
    runOnJS(onClose)();
  };

  const pinch = Gesture.Pinch()
    .onUpdate(e => {
      scale.value = Math.min(MAX_ZOOM, Math.max(1, savedScale.value * e.scale));
    })
    .onEnd(() => {
      if (scale.value < 1.05) {
        resetZoom();
        runOnJS(setZoomed)(false);
      } else {
        savedScale.value = scale.value;
        runOnJS(setZoomed)(true);
      }
    });

  // Not zoomed: a mostly vertical drag moves the photo towards dismissal and
  // a horizontal one is left to the pager. Zoomed: any drag pans the photo.
  const basePan = Gesture.Pan();
  const pan = (zoomed ? basePan.activeOffsetY([-4, 4]).activeOffsetX([-4, 4]) : basePan.activeOffsetY([-14, 14]).failOffsetX([-14, 14]))
    .onUpdate(e => {
      if (scale.value > 1) {
        panX.value = savedPanX.value + e.translationX;
        panY.value = savedPanY.value + e.translationY;
      } else {
        dragY.value = e.translationY;
      }
    })
    .onEnd(e => {
      if (scale.value > 1) {
        savedPanX.value = panX.value;
        savedPanY.value = panY.value;
        return;
      }
      const thrown = Math.abs(e.translationY) > DISMISS_DISTANCE || Math.abs(e.velocityY) > DISMISS_VELOCITY;
      if (thrown) {
        const direction = e.translationY < 0 || (e.translationY === 0 && e.velocityY < 0) ? -1 : 1;
        dragY.value = withTiming(direction * height, { duration: 220, easing: Easing.in(Easing.cubic) }, done => {
          if (done) finish();
        });
      } else {
        dragY.value = withSpring(0, SPRING);
      }
    });

  const doubleTap = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd(() => {
      if (scale.value > 1) {
        resetZoom();
        runOnJS(setZoomed)(false);
      } else {
        scale.value = withSpring(2.5, SPRING);
        savedScale.value = 2.5;
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
            scrollEnabled={!zoomed && images.length > 1}
            bounces={false}
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={e => onPageChange(e.nativeEvent.contentOffset.x)}
          >
            {images.map(uri => (
              <View key={uri} style={{ width, height, justifyContent: 'center' }}>
                <Animated.Image source={{ uri }} resizeMode="contain" style={[{ width, height: height * 0.7 }, photoStyle]} />
              </View>
            ))}
          </ScrollView>
        </GestureDetector>

        {/* Close button */}
        <Animated.View style={[{ position: 'absolute', top: insets.top + spacing.sm, right: spacing.lg }, chromeStyle]}>
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
        <Animated.View pointerEvents="none" style={[{ position: 'absolute', left: 0, right: 0, bottom: insets.bottom + spacing.xl, alignItems: 'center', gap: spacing.md }, chromeStyle]}>
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
