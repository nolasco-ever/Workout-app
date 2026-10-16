import { useLayoutEffect } from 'react';
import { Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { ParamListBase } from '@react-navigation/native';
import { useLayoutFamily } from '../components/layout/useLayoutFamily';
import { useTheme } from '../theme';

/**
 * A screen with two panes side by side gets a plain header on a wide
 * window: the ground colour, no glass edge effect. iOS draws that effect
 * from the one scroll view it ties to the bar, so it covered the list's
 * half and stopped at the pane, and with the effect off alone the bar went
 * transparent over the list; a solid bar reads as one piece across both.
 * Phones keep the system header.
 */
export const useNoHeaderGlass = (): void => {
  const navigation = useNavigation<NativeStackNavigationProp<ParamListBase>>();
  const { colors } = useTheme();
  const wide = useLayoutFamily() === 'wide';
  useLayoutEffect(() => {
    if (Platform.OS !== 'ios') return;
    navigation.setOptions(wide ? { scrollEdgeEffects: { top: 'hidden' }, headerStyle: { backgroundColor: colors.ground } } : { scrollEdgeEffects: { top: 'automatic' }, headerStyle: undefined });
  }, [navigation, wide, colors.ground]);
};
