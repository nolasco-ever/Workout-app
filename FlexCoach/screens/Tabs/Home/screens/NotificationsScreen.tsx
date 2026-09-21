import React from 'react';
import { ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CustomText } from '../../../../components/text/customText';
import { SurfaceCard } from '../../../../components/cards/SurfaceCard';
import { Row } from '../../../../components/list-items/Row';
import { generalIcons } from '../../../../components/icons/icon-library';
import { mockNotificationMessages } from '../../../../mocks/listItemMocks';
import { useTheme } from '../../../../theme';

/** Sample notifications until a real source exists (buddies and reminders, later). */
export const NotificationsScreen = () => {
  const { colors, spacing } = useTheme();
  const iconFor = (type: string) =>
    type === 'pr' ? generalIcons.trophy : type === 'health' ? generalIcons.heart : type === 'workout' ? generalIcons.dumbbell : type === 'news' ? generalIcons.book : generalIcons.bell;
  const colorFor = (type: string) => (type === 'pr' ? colors.warning : type === 'health' ? colors.error : type === 'workout' ? colors.accent : colors.inkMuted);
  const groups = ['Today', 'Yesterday', 'Last Week'];

  return (
    <SafeAreaView edges={['bottom', 'left', 'right']} style={{ flex: 1, backgroundColor: colors.ground }}>
      <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.lg }}>
        <CustomText variant="caption" color={colors.inkMuted}>These are sample notifications. Real ones arrive with reminders and buddies.</CustomText>
        {groups.map(group => {
          const items = mockNotificationMessages.filter(m => m.date === group);
          if (items.length === 0) return null;
          return (
            <View key={group} style={{ gap: spacing.sm }}>
              <CustomText variant="overline" color={colors.inkMuted}>{group}</CustomText>
              <SurfaceCard style={{ padding: 0 }}>
                {items.map((m, i) => (
                  <Row key={m.id} icon={iconFor(m.type)} iconColor={colorFor(m.type)} title={m.title} description={m.message} right={m.timePassed} chevron={false} divider={i > 0} />
                ))}
              </SurfaceCard>
            </View>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
};
