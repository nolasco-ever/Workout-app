import React from 'react';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CustomText } from '../components/text/customText';
import { Icon } from '../components/icons/Icon';
import { generalIcons } from '../components/icons/icon-library';
import { useTheme } from '../theme';

export const PlaceholderScreen = ({ route }: { route: { params: { title: string } } }) => {
  const { colors, spacing } = useTheme();
  return (
    <SafeAreaView edges={['bottom', 'left', 'right']} style={{ flex: 1, backgroundColor: colors.ground }}>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl, gap: spacing.md }}>
        <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: colors.surfaceRaised, alignItems: 'center', justifyContent: 'center' }}>
          <Icon icon={generalIcons.screwdriverWrench} size={28} color={colors.inkMuted} />
        </View>
        <CustomText variant="title" centered>{route.params.title}</CustomText>
        <CustomText variant="body" color={colors.inkMuted} centered>This part isn't built yet. It's on the list.</CustomText>
      </View>
    </SafeAreaView>
  );
};
