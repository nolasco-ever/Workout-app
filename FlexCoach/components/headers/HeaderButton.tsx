import React from 'react';
import { Platform, TouchableOpacity } from 'react-native';
import { Icon, IconSource } from '../icons/Icon';
import { useTheme } from '../../theme';

/** An icon button for native header left/right slots. */
export const HeaderButton = ({ icon, onPress, accessibilityLabel }: { icon: IconSource; onPress: () => void; accessibilityLabel: string }) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity onPress={onPress} hitSlop={10} accessibilityRole="button" accessibilityLabel={accessibilityLabel} style={{ paddingHorizontal: Platform.OS === 'android' ? 8 : 0 }}>
      <Icon icon={icon} color={colors.ink} size={24} />
    </TouchableOpacity>
  );
};
