import React from 'react';
import { View } from 'react-native';
import { NoticeContent, NoticeText } from '../../data/engine/notices';
import { BottomSheet } from './BottomSheet';
import { CustomText } from '../text/customText';
import { Icon } from '../icons/Icon';
import { generalIcons } from '../icons/icon-library';
import { PrimaryButton } from '../buttons/PrimaryButton';
import { useTheme } from '../../theme';

const Line = ({ text }: { text: NoticeText }) => {
  const { colors } = useTheme();
  return (
    <CustomText variant="body" style={{ flex: 1 }}>
      {text.map((part, i) => (typeof part === 'string' ? part : <CustomText key={i} variant="bodyStrong" color={colors.ink}>{part.bold}</CustomText>))}
    </CustomText>
  );
};

/**
 * The reusable Notice sheet (v1 #10.10, the "Notice" boards): an info mark
 * and "Notice", an optional intro, the changes in a box with a check each,
 * an optional footnote, "Got it", and maybe a second way out. Putting it
 * away any other way (the scrim, a swipe) counts as "Got it".
 */
export const NoticeSheet = ({ open, content, onDone, onSecondary }: { open: boolean; content: NoticeContent | null; onDone: () => void; onSecondary?: () => void }) => {
  const { colors, spacing, radius } = useTheme();
  return (
    <BottomSheet
      open={open}
      title="Notice"
      titleIcon={{ icon: generalIcons.info, color: colors.info, tint: colors.infoTint }}
      hideClose
      onClose={onDone}
      footer={
        <View style={{ gap: spacing.sm }}>
          <PrimaryButton label="Got it" onPress={onDone} />
          {content?.secondary && onSecondary && <PrimaryButton label={content.secondary.label} variant="quiet" onPress={onSecondary} />}
        </View>
      }
    >
      {content && (
        <View style={{ gap: spacing.md }}>
          {content.intro && <CustomText variant="body" color={colors.inkMuted}>{content.intro}</CustomText>}
          <View style={{ borderRadius: radius.lg, backgroundColor: colors.ground, paddingHorizontal: spacing.md }}>
            {content.items.map((item, i) => (
              <View key={i} style={{ flexDirection: 'row', gap: spacing.sm, paddingVertical: spacing.sm + 2, borderTopWidth: i === 0 ? 0 : 1, borderTopColor: colors.line }}>
                <View style={{ paddingTop: 3 }}>
                  <Icon icon={generalIcons.check} size={16} color={colors.success} strokeWidth={3} />
                </View>
                <Line text={item} />
              </View>
            ))}
          </View>
          {content.footnote && <CustomText variant="caption" color={colors.inkMuted}>{content.footnote}</CustomText>}
        </View>
      )}
    </BottomSheet>
  );
};
