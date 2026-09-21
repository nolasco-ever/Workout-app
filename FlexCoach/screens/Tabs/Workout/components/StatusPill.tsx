import React from 'react';
import { View } from 'react-native';
import { OccurrenceStatus } from '../../../../data/models';
import { CustomText } from '../../../../components/text/customText';
import { useTheme } from '../../../../theme';

const labels: Record<OccurrenceStatus, string> = {
  scheduled: 'Scheduled',
  in_progress: 'In progress',
  completed: 'Done',
  skipped: 'Skipped',
  rest: 'Rest',
};

export const StatusPill = ({ status, pushed = false }: { status: OccurrenceStatus; pushed?: boolean }) => {
  const { colors, radius, spacing } = useTheme();
  const tone =
    status === 'completed'
      ? { bg: colors.successTint, fg: colors.success }
      : status === 'skipped'
        ? { bg: colors.errorTint, fg: colors.error }
        : status === 'in_progress'
          ? { bg: colors.accentTint, fg: colors.accent }
          : pushed
            ? { bg: colors.warningTint, fg: colors.warning }
            : { bg: colors.surfaceRaised, fg: colors.inkMuted };
  const label = status === 'scheduled' && pushed ? 'Pushed' : labels[status];
  return (
    <View style={{ backgroundColor: tone.bg, borderRadius: radius.pill, paddingHorizontal: spacing.sm + 2, paddingVertical: 3 }}>
      <CustomText variant="overline" color={tone.fg}>
        {label}
      </CustomText>
    </View>
  );
};
