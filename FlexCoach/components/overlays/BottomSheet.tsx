import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Modal, ScrollView, TouchableOpacity, TouchableWithoutFeedback, useWindowDimensions, View } from 'react-native';
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
}

/**
 * A sheet that slides up over the current screen with a scrim behind it.
 * Tapping the scrim or the close button dismisses it. Content scrolls if it
 * is taller than the sheet's maximum height.
 *
 * The scrim fades while the sheet slides: with the Modal's own slide
 * animation the scrim rode up with the sheet and its top edge was visible.
 */
export const BottomSheet = ({ open, title, onClose, children, footer }: Props) => {
  const { colors, spacing, radius } = useTheme();
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const [mounted, setMounted] = useState(open);
  const [sheetHeight, setSheetHeight] = useState(windowHeight);
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (open) {
      setMounted(true);
      Animated.timing(progress, { toValue: 1, duration: 280, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
    } else {
      Animated.timing(progress, { toValue: 0, duration: 220, easing: Easing.in(Easing.cubic), useNativeDriver: true }).start(({ finished }) => {
        if (finished) setMounted(false);
      });
    }
  }, [open, progress]);

  const translateY = progress.interpolate({ inputRange: [0, 1], outputRange: [sheetHeight, 0] });

  return (
    <Modal visible={mounted} transparent animationType="none" onRequestClose={onClose} statusBarTranslucent>
      <View style={{ flex: 1, justifyContent: 'flex-end' }}>
        <TouchableWithoutFeedback onPress={onClose} accessibilityLabel="Close">
          <Animated.View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: colors.scrim, opacity: progress }} />
        </TouchableWithoutFeedback>
        <Animated.View
          onLayout={e => setSheetHeight(e.nativeEvent.layout.height)}
          style={{ maxHeight: '85%', backgroundColor: colors.surface, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, paddingBottom: insets.bottom + spacing.md, transform: [{ translateY }] }}
        >
          <View style={{ alignItems: 'center', paddingTop: spacing.sm }}>
            <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: colors.line }} />
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingVertical: spacing.md }}>
            <CustomText variant="heading">{title}</CustomText>
            <TouchableOpacity onPress={onClose} hitSlop={10} accessibilityRole="button" accessibilityLabel="Close" style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: colors.surfaceRaised, alignItems: 'center', justifyContent: 'center' }}>
              <Icon icon={generalIcons.xMark} size={18} color={colors.ink} />
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingBottom: spacing.md, gap: spacing.lg }} keyboardShouldPersistTaps="handled">
            {children}
          </ScrollView>
          {footer && <View style={{ paddingHorizontal: spacing.lg, paddingTop: spacing.md, borderTopWidth: 1, borderTopColor: colors.line }}>{footer}</View>}
        </Animated.View>
      </View>
    </Modal>
  );
};
