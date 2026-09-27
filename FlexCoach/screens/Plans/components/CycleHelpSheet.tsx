import React, { useState } from 'react';
import { TouchableOpacity, View } from 'react-native';
import { BottomSheet } from '../../../components/overlays/BottomSheet';
import { CustomText } from '../../../components/text/customText';
import { Icon } from '../../../components/icons/Icon';
import { generalIcons } from '../../../components/icons/icon-library';
import { useTheme } from '../../../theme';

const POINTS: { title: string; body: string }[] = [
  { title: 'A cycle is one pass through your schedule', body: 'Every workout in the plan, done in order. Miss a day and the app asks whether to skip it or push it along.' },
  { title: 'Your targets hold for the whole cycle', body: 'Weights and reps stay put from the first workout to the last, so you can settle into them. One good day doesn’t bump the weight two days later.' },
  { title: 'The review is your checkpoint', body: 'At the end you get a report card: workouts done, on time, pushed or skipped, volume, and any personal records.' },
  { title: 'That’s when weights and reps move', body: 'The app looks at every session of each exercise in the cycle. Hit your reps every time, and the weight goes up with reps starting at the bottom of the range. Fall short, and the reps ease back to what you managed. The review tells you what changed and why.' },
];

/** The short version of what cycles are for, behind a "?" next to the cycle length. */
export const CycleHelpSheet = ({ open, onClose }: { open: boolean; onClose: () => void }) => {
  const { colors, spacing, radius } = useTheme();
  return (
    <BottomSheet open={open} title="What a cycle does" onClose={onClose}>
      <View style={{ gap: spacing.lg, paddingBottom: spacing.lg }}>
        <CustomText variant="body" color={colors.inkMuted}>
          Cycles are how the app paces your progress. Shorter cycles mean quicker checkpoints; longer ones mean more data before anything changes.
        </CustomText>
        {POINTS.map((p, i) => (
          <View key={p.title} style={{ flexDirection: 'row', gap: spacing.md }}>
            <View style={{ width: 26, height: 26, borderRadius: radius.pill, backgroundColor: colors.accentTint, alignItems: 'center', justifyContent: 'center' }}>
              <CustomText variant="label" color={colors.accent}>{i + 1}</CustomText>
            </View>
            <View style={{ flex: 1, gap: 2 }}>
              <CustomText variant="bodyStrong">{p.title}</CustomText>
              <CustomText variant="body" color={colors.inkMuted}>{p.body}</CustomText>
            </View>
          </View>
        ))}
      </View>
    </BottomSheet>
  );
};

/** A "?" that opens the cycle explainer. Put it beside the cycle-length control. */
export const CycleHelpButton = () => {
  const { colors } = useTheme();
  const [open, setOpen] = useState(false);
  return (
    <>
      <TouchableOpacity onPress={() => setOpen(true)} hitSlop={10} accessibilityRole="button" accessibilityLabel="What is a cycle?">
        <Icon icon={generalIcons.help} size={20} color={colors.accent} />
      </TouchableOpacity>
      <CycleHelpSheet open={open} onClose={() => setOpen(false)} />
    </>
  );
};
