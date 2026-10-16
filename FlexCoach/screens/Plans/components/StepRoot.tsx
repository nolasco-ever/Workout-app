import React from 'react';
import { View } from 'react-native';
import { SafeAreaView } from '../../../components/layout/SafeAreaView';
import { useTheme } from '../../../theme';

/**
 * The root of a creator step: its own screen on a phone, or a pane inside
 * the plan workspace on a wide window, where the workspace already keeps
 * clear of the display's edges.
 */
export const StepRoot = ({ embedded, children }: { embedded: boolean; children: React.ReactNode }) => {
  const { colors } = useTheme();
  if (embedded) return <View style={{ flex: 1, backgroundColor: colors.ground }}>{children}</View>;
  return (
    <SafeAreaView edges={['bottom', 'left', 'right']} style={{ flex: 1, backgroundColor: colors.ground }}>
      {children}
    </SafeAreaView>
  );
};
