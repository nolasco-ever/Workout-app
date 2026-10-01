import React from 'react';
import { TouchableOpacity, View } from 'react-native';
import { LiquidGlassView, isLiquidGlassSupported } from '@callstack/liquid-glass';
import { Icon, IconSource } from '../icons/Icon';
import { useTheme } from '../../theme';

/** Same size as the native header buttons, so the two kinds sit level across screens. */
export const GLASS_BUTTON_SIZE = 44;

interface Props {
  icon: IconSource;
  onPress: () => void;
  accessibilityLabel: string;
  /** Draws an unread dot on the icon. */
  badge?: boolean;
}

/**
 * A round icon button for screens that draw their own header row. On iOS
 * 26 it is a real Liquid Glass circle, the same UIKit material the native
 * header buttons use; older iOS and Android get the raised surface disc.
 */
export const GlassIconButton = ({ icon, onPress, accessibilityLabel, badge = false }: Props) => {
  const { colors } = useTheme();
  const size = GLASS_BUTTON_SIZE;
  return (
    <TouchableOpacity onPress={onPress} hitSlop={6} accessibilityRole="button" accessibilityLabel={badge ? `${accessibilityLabel}, unread` : accessibilityLabel} activeOpacity={isLiquidGlassSupported ? 1 : 0.6} style={{ width: size, height: size }}>
      <LiquidGlassView
        interactive
        effect="regular"
        style={[{ width: size, height: size, borderRadius: size / 2, alignItems: 'center', justifyContent: 'center' }, !isLiquidGlassSupported && { backgroundColor: colors.surfaceRaised }]}
      >
        <View>
          <Icon icon={icon} color={colors.ink} size={22} />
          {badge && <View style={{ position: 'absolute', top: -1, right: -1, width: 10, height: 10, borderRadius: 5, backgroundColor: colors.accent, borderWidth: 2, borderColor: isLiquidGlassSupported ? colors.ground : colors.surfaceRaised }} />}
        </View>
      </LiquidGlassView>
    </TouchableOpacity>
  );
};
