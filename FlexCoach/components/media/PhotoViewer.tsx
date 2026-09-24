import React, { useEffect, useRef, useState } from 'react';
import { Image, Modal, ScrollView, StatusBar, TouchableOpacity, useWindowDimensions, View } from 'react-native';
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

/**
 * Full-screen photo viewer: swipe between photos, pinch to zoom, tap the
 * close button or the photo to dismiss. Zoom resets when the page changes.
 */
export const PhotoViewer = ({ images, captions = [], index, onClose }: Props) => {
  const { colors, spacing, radius } = useTheme();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const pager = useRef<React.ComponentRef<typeof ScrollView>>(null);
  const zoomers = useRef<(React.ComponentRef<typeof ScrollView> | null)[]>([]);
  const [page, setPage] = useState(index ?? 0);
  const open = index !== null;

  useEffect(() => {
    if (index === null) return;
    setPage(index);
    // Jump to the requested page once the modal has laid out.
    const id = setTimeout(() => pager.current?.scrollTo({ x: index * width, animated: false }), 0);
    return () => clearTimeout(id);
  }, [index, width]);

  const onPageChange = (x: number) => {
    const next = Math.round(x / width);
    if (next !== page) {
      zoomers.current[page]?.scrollResponderZoomTo?.({ x: 0, y: 0, width, height, animated: false });
      setPage(next);
    }
  };

  return (
    <Modal visible={open} transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <StatusBar barStyle="light-content" />
      <View style={{ flex: 1, backgroundColor: '#000' }}>
        <ScrollView
          ref={pager}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={e => onPageChange(e.nativeEvent.contentOffset.x)}
        >
          {images.map((uri, i) => (
            <ScrollView
              key={uri}
              ref={el => { zoomers.current[i] = el; }}
              style={{ width, height }}
              contentContainerStyle={{ width, height }}
              maximumZoomScale={4}
              minimumZoomScale={1}
              bouncesZoom
              showsVerticalScrollIndicator={false}
              showsHorizontalScrollIndicator={false}
              centerContent
            >
              <TouchableOpacity activeOpacity={1} onPress={onClose} style={{ width, height, justifyContent: 'center' }}>
                <Image source={{ uri }} resizeMode="contain" style={{ width, height: height * 0.7 }} />
              </TouchableOpacity>
            </ScrollView>
          ))}
        </ScrollView>

        {/* Close button */}
        <TouchableOpacity
          onPress={onClose}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel="Close"
          style={{ position: 'absolute', top: insets.top + spacing.sm, right: spacing.lg, width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' }}
        >
          <Icon icon={generalIcons.xMark} size={22} color="#FFFFFF" />
        </TouchableOpacity>

        {/* Caption and page dots */}
        <View pointerEvents="none" style={{ position: 'absolute', left: 0, right: 0, bottom: insets.bottom + spacing.xl, alignItems: 'center', gap: spacing.md }}>
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
        </View>
      </View>
    </Modal>
  );
};
