import React from 'react';
import { Platform, TouchableOpacity, View } from 'react-native';
import { Icon, IconSource } from '../icons/Icon';
import { useTheme } from '../../theme';

/** An icon button for native header left/right slots. `badge` draws an unread dot on the icon. */
export const HeaderButton = ({ icon, onPress, accessibilityLabel, badge = false }: { icon: IconSource; onPress: () => void; accessibilityLabel: string; badge?: boolean }) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity onPress={onPress} hitSlop={10} accessibilityRole="button" accessibilityLabel={badge ? `${accessibilityLabel}, unread` : accessibilityLabel} style={{ paddingHorizontal: Platform.OS === 'android' ? 8 : 0 }}>
      <View>
        <Icon icon={icon} color={colors.ink} size={24} />
        {badge && <View style={{ position: 'absolute', top: -1, right: -1, width: 10, height: 10, borderRadius: 5, backgroundColor: colors.accent, borderWidth: 2, borderColor: colors.ground }} />}
      </View>
    </TouchableOpacity>
  );
};
