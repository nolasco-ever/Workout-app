import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Image, Modal, Pressable, useWindowDimensions, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { Easing, interpolate, runOnJS, useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SurfaceCard } from '../cards/SurfaceCard';
import { Row } from '../list-items/Row';
import { Icon } from '../icons/Icon';
import { generalIcons } from '../icons/icon-library';
import { Avatar } from '../buddies/Avatar';
import { isAvatarUri, isPhotoUri } from '../../data/engine/avatars';
import { features } from '../../config/features';
import { useTheme } from '../../theme';

/** Where the small avatar sits on screen, in window coordinates, so the big one can grow out of it. */
export interface PhotoOrigin {
  x: number;
  y: number;
  size: number;
}

interface Props {
  open: boolean;
  /** The avatar's position when it was tapped. Null falls back to growing from the centre. */
  origin: PhotoOrigin | null;
  /** The current photo or `avatar:<id>`, or null for the placeholder. */
  uri: string | null;
  /** A save or removal is in flight: the options are disabled and the photo shows a spinner. */
  busy: boolean;
  onClose: () => void;
  /** The sheet is on screen with its first frame drawn; the caller can hide what it covers. */
  onShown?: () => void;
  onChooseLibrary: () => void;
  onTakePhoto: () => void;
  /** Opens the built-in avatar picker (the caller closes this sheet first). */
  onChooseAvatar: () => void;
  onRemove: () => void;
}

/** Size of the expanded circle. */
export const expandedPhotoSize = (windowWidth: number): number => Math.min(windowWidth - 32, 340);

/** Matches the edit badge drawn on the Profile tab's avatar. */
export const EDIT_BADGE = 36;

const OPEN_MS = 320;
const CLOSE_MS = 260;
/** Drag distance or fling speed that counts as "throw it away". */
const DISMISS_DISTANCE = 110;
const DISMISS_VELOCITY = 900;

/**
 * The profile photo, grown from the avatar into a large circle over a
 * dimmed screen, with the ways to change it underneath. Tap anywhere or
 * flick the photo to put it back; while dragging, the photo follows the
 * finger and the screen brightens as it moves.
 *
 * Two things keep it from flickering:
 * - The circle is laid out at full size and scaled with a transform.
 *   Animating its width and height re-requested the image at every size.
 * - The full-size image can't come from React Native's decoded-image
 *   cache (that cache skips anything over 2MB, and a 340pt circle on a 3x
 *   screen decodes to about 4MB), so it always loads asynchronously. The
 *   circle therefore shows the small avatar image, which is cached, from
 *   its first frame, and the full-size one fades in over it once loaded.
 *
 * The edit badge is drawn here too, fading out as the circle grows, so the
 * caller can hide its own badge while the sheet is up and nothing overlaps
 * on the way back.
 */
export const ProfilePhotoModal = ({ open, origin, uri, busy, onClose, onShown, onChooseLibrary, onTakePhoto, onChooseAvatar, onRemove }: Props) => {
  const { colors, spacing } = useTheme();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();

  const big = expandedPhotoSize(width);
  const rows = 2 + (features.avatars ? 1 : 0) + (uri ? 1 : 0);
  // Room for the options card at the bottom; the photo centres in what's left.
  const cardHeight = rows * 60 + spacing.lg * 2 + insets.bottom;
  const target = { x: (width - big) / 2, y: Math.max(insets.top + spacing.lg, (height - cardHeight - big) / 2), size: big };
  const from = origin ?? { x: width / 2 - 60, y: height / 2 - 60, size: 120 };
  const photo = isPhotoUri(uri);

  // Modal stays mounted while the close animation plays.
  const [mounted, setMounted] = useState(open);
  const progress = useSharedValue(0);
  const dragX = useSharedValue(0);
  const dragY = useSharedValue(0);
  /** 0 until the full-size image has loaded, then 1. */
  const loaded = useSharedValue(0);

  const finishClose = () => {
    setMounted(false);
    onClose();
  };

  const close = () => {
    'worklet';
    dragX.value = withTiming(0, { duration: CLOSE_MS });
    dragY.value = withTiming(0, { duration: CLOSE_MS });
    progress.value = withTiming(0, { duration: CLOSE_MS, easing: Easing.inOut(Easing.cubic) }, done => {
      if (done) runOnJS(finishClose)();
    });
  };

  useEffect(() => {
    if (open) {
      setMounted(true);
      dragX.value = 0;
      dragY.value = 0;
      loaded.value = 0;
      progress.value = withTiming(1, { duration: OPEN_MS, easing: Easing.out(Easing.cubic) });
    } else if (mounted) {
      close();
    }
    // `close` and `mounted` are stable enough; the effect is about `open` flipping.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const pan = Gesture.Pan()
    .onUpdate(e => {
      dragX.value = e.translationX;
      dragY.value = e.translationY;
    })
    .onEnd(e => {
      const thrown = Math.hypot(e.translationX, e.translationY) > DISMISS_DISTANCE || Math.hypot(e.velocityX, e.velocityY) > DISMISS_VELOCITY;
      if (thrown) close();
      else {
        dragX.value = withSpring(0, { damping: 18, stiffness: 220 });
        dragY.value = withSpring(0, { damping: 18, stiffness: 220 });
      }
    });
  const tap = Gesture.Tap().onEnd(() => close());
  const gesture = Gesture.Exclusive(pan, tap);

  // Centre-to-centre offset between where the avatar sits and where the big
  // circle lands; the translate shrinks to zero as the scale grows to one.
  const fromCentre = { x: from.x + from.size / 2, y: from.y + from.size / 2 };
  const targetCentre = { x: target.x + target.size / 2, y: target.y + target.size / 2 };
  const photoStyle = useAnimatedStyle(() => {
    const p = progress.value;
    return {
      position: 'absolute',
      left: target.x,
      top: target.y,
      width: target.size,
      height: target.size,
      borderRadius: target.size / 2,
      transform: [
        { translateX: (fromCentre.x - targetCentre.x) * (1 - p) + dragX.value },
        { translateY: (fromCentre.y - targetCentre.y) * (1 - p) + dragY.value },
        { scale: interpolate(p, [0, 1], [from.size / target.size, 1]) },
      ],
    };
  });
  // The badge rides on the circle's bottom-right corner, unscaled, and is
  // only there while the circle is (nearly) back at avatar size.
  const badgeStyle = useAnimatedStyle(() => {
    const p = progress.value;
    const size = target.size * interpolate(p, [0, 1], [from.size / target.size, 1]);
    const cx = targetCentre.x + (fromCentre.x - targetCentre.x) * (1 - p) + dragX.value;
    const cy = targetCentre.y + (fromCentre.y - targetCentre.y) * (1 - p) + dragY.value;
    return {
      position: 'absolute',
      left: cx + size / 2 - EDIT_BADGE,
      top: cy + size / 2 - EDIT_BADGE,
      opacity: interpolate(p, [0, 0.25], [1, 0]),
    };
  });
  const fullStyle = useAnimatedStyle(() => ({ opacity: loaded.value }));
  const scrimStyle = useAnimatedStyle(() => {
    const drag = Math.min(1, Math.hypot(dragX.value, dragY.value) / (DISMISS_DISTANCE * 2));
    return { opacity: progress.value * (1 - drag * 0.6) };
  });
  const cardStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 0.6, 1], [0, 0, 1]),
    transform: [{ translateY: interpolate(progress.value, [0, 1], [40, 0]) }],
  }));

  return (
    <Modal visible={mounted} animationType="none" onShow={onShown} onRequestClose={() => close()} statusBarTranslucent navigationBarTranslucent presentationStyle="overFullScreen" transparent>
      <View style={{ flex: 1 }}>
        {/* Dimmed screen; tapping it anywhere closes. */}
        <Animated.View style={[{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: colors.ground }, scrimStyle]}>
          <Pressable onPress={() => close()} accessibilityRole="button" accessibilityLabel="Close" style={{ flex: 1 }} />
        </Animated.View>

        <GestureDetector gesture={gesture}>
          <Animated.View style={[{ backgroundColor: colors.surfaceRaised, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' }, photoStyle]}>
            {photo ? (
              <>
                {/* Same layout size as the tab's avatar, so this is a decoded-cache hit and paints on the first frame. */}
                <Image source={{ uri }} resizeMode="cover" style={{ width: from.size, height: from.size, transform: [{ scale: big / from.size }] }} />
                <Animated.Image source={{ uri }} resizeMode="cover" onLoad={() => { loaded.value = withTiming(1, { duration: 160 }); }} style={[{ position: 'absolute', top: 0, left: 0, width: big, height: big }, fullStyle]} />
              </>
            ) : (
              <Avatar uri={uri} size={big} fallback="icon" />
            )}
            {busy && (
              <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: colors.scrim, alignItems: 'center', justifyContent: 'center' }}>
                <ActivityIndicator color={colors.onAccent} />
              </View>
            )}
          </Animated.View>
        </GestureDetector>

        <Animated.View pointerEvents="none" style={[{ width: EDIT_BADGE, height: EDIT_BADGE, borderRadius: EDIT_BADGE / 2, backgroundColor: colors.accent, borderWidth: 3, borderColor: colors.ground, alignItems: 'center', justifyContent: 'center' }, badgeStyle]}>
          <Icon icon={generalIcons.pencil} size={18} color={colors.onAccent} strokeWidth={2.5} />
        </Animated.View>

        <Animated.View style={[{ position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: spacing.lg, paddingBottom: insets.bottom + spacing.lg }, cardStyle]}>
          <SurfaceCard style={{ padding: 0, opacity: busy ? 0.5 : 1 }}>
            <Row icon={generalIcons.images} iconColor={colors.accent} title={uri ? 'Replace from library' : 'Choose from library'} onPress={busy ? undefined : onChooseLibrary} chevron={false} />
            <Row icon={generalIcons.camera} iconColor={colors.accent} title="Take a photo" divider onPress={busy ? undefined : onTakePhoto} chevron={false} />
            {features.avatars && <Row icon={generalIcons.smile} iconColor={colors.accent} title="Pick an avatar" divider onPress={busy ? undefined : onChooseAvatar} chevron={false} />}
            {uri && <Row icon={generalIcons.trash} title={isAvatarUri(uri) ? 'Remove avatar' : 'Remove photo'} tone="destructive" divider onPress={busy ? undefined : onRemove} chevron={false} />}
          </SurfaceCard>
        </Animated.View>
      </View>
    </Modal>
  );
};
