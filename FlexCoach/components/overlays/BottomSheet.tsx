import React from 'react';
import { Modal, ScrollView, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';
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
 */
export const BottomSheet = ({ open, title, onClose, children, footer }: Props) => {
  const { colors, spacing, radius } = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={open} transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <View style={{ flex: 1, justifyContent: 'flex-end' }}>
        <TouchableWithoutFeedback onPress={onClose} accessibilityLabel="Close">
          <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: colors.scrim }} />
        </TouchableWithoutFeedback>
        <View style={{ maxHeight: '85%', backgroundColor: colors.surface, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, paddingBottom: insets.bottom + spacing.md }}>
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
        </View>
      </View>
    </Modal>
  );
};
