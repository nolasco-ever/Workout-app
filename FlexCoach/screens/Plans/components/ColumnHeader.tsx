import React from 'react';
import { View } from 'react-native';
import { GlassIconButton } from '../../../components/buttons/GlassIconButton';
import { IconSource } from '../../../components/icons/Icon';
import { directionIcons } from '../../../components/icons/icon-library';
import { CustomText } from '../../../components/text/customText';
import { useTheme } from '../../../theme';

/** A workspace column's title row: a back chevron when the column slid in over another, the title, an optional action at the right. */
export const ColumnHeader = ({ title, onBack, action }: { title: string; onBack?: () => void; action?: { icon: IconSource; accessibilityLabel: string; onPress: () => void } }) => {
  const { spacing } = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingHorizontal: spacing.lg, paddingTop: spacing.lg }}>
      {onBack && <GlassIconButton icon={directionIcons.angleLeft} nudgeX={-1} accessibilityLabel="Back" onPress={onBack} />}
      <CustomText variant="title" numberOfLines={1} style={{ flex: 1 }}>{title}</CustomText>
      {action && <GlassIconButton icon={action.icon} accessibilityLabel={action.accessibilityLabel} onPress={action.onPress} />}
    </View>
  );
};
