import React from 'react';
import { View } from 'react-native';
import { GlassIconButton } from '../../../components/buttons/GlassIconButton';
import { IconSource } from '../../../components/icons/Icon';
import { CustomText } from '../../../components/text/customText';
import { useTheme } from '../../../theme';

/** A workspace column's title row: the title and an optional action at the right. (The native back button is the way back, a column at a time.) */
export const ColumnHeader = ({ title, action }: { title: string; action?: { icon: IconSource; accessibilityLabel: string; onPress: () => void } }) => {
  const { spacing } = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingHorizontal: spacing.lg, paddingTop: spacing.lg }}>
      <CustomText variant="title" numberOfLines={1} style={{ flex: 1 }}>{title}</CustomText>
      {action && <GlassIconButton icon={action.icon} accessibilityLabel={action.accessibilityLabel} onPress={action.onPress} />}
    </View>
  );
};
