import React, { useCallback, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NavigationProp, useFocusEffect, useNavigation } from '@react-navigation/native';
import { useBuddies } from '../../data/hooks/useBuddies';
import { useBuddyActivity } from '../../data/hooks/useBuddyActivity';
import { CustomText } from '../../components/text/customText';
import { SurfaceCard } from '../../components/cards/SurfaceCard';
import { PrimaryButton } from '../../components/buttons/PrimaryButton';
import { ActivityRow } from '../../components/buddies/ActivityRow';
import { useTheme } from '../../theme';
import { BuddyRoutes } from './routes';

const dayGroup = (ts: number, now = Date.now()): string => {
  const d = new Date(ts);
  const n = new Date(now);
  if (d.toDateString() === n.toDateString()) return 'Today';
  const days = Math.round((n.setHours(0, 0, 0, 0) - new Date(ts).setHours(0, 0, 0, 0)) / 86_400_000);
  if (days === 1) return 'Yesterday';
  if (days < 7) return 'This week';
  return 'Earlier';
};

/** Everything you and your buddies have done lately, newest first. */
export const BuddyActivityScreen = () => {
  const navigation = useNavigation<NavigationProp<BuddyRoutes>>();
  const { colors, spacing } = useTheme();
  const { buddies, loading: buddiesLoading } = useBuddies();
  const feed = useBuddyActivity(buddies, 60);
  const [refreshing, setRefreshing] = useState(false);
  useFocusEffect(
    useCallback(() => {
      feed.refresh().catch(() => undefined);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [feed.refresh]),
  );
  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await feed.refresh();
    } finally {
      setRefreshing(false);
    }
  };

  const groups: { label: string; items: typeof feed.items }[] = [];
  for (const item of feed.items) {
    const label = dayGroup(item.at);
    const last = groups[groups.length - 1];
    if (last && last.label === label) last.items.push(item);
    else groups.push({ label, items: [item] });
  }

  return (
    <SafeAreaView edges={['bottom', 'left', 'right']} style={{ flex: 1, backgroundColor: colors.ground }}>
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />}
        contentContainerStyle={{ padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing.xxl, flexGrow: 1 }}
      >
        {(buddiesLoading || feed.loading) && <ActivityIndicator color={colors.accent} style={{ marginTop: spacing.xxl }} />}
        {!buddiesLoading && !feed.loading && feed.items.length === 0 && (
          <View style={{ flex: 1, justifyContent: 'center', gap: spacing.md, padding: spacing.lg }}>
            <CustomText variant="heading" centered>Nothing here yet</CustomText>
            <CustomText variant="body" color={colors.inkMuted} centered>
              {buddies.length === 0 ? 'Add a buddy and their finished workouts, streaks and records show up here alongside yours.' : 'Finished workouts, streaks and records from you and your buddies land here.'}
            </CustomText>
            {buddies.length === 0 && <PrimaryButton label="Add a buddy" onPress={() => navigation.navigate('BuddiesScreen')} />}
          </View>
        )}
        {groups.map(group => (
          <View key={group.label} style={{ gap: spacing.sm }}>
            <CustomText variant="overline" color={colors.inkMuted}>{group.label}</CustomText>
            <SurfaceCard style={{ padding: 0 }}>
              {group.items.map((item, i) => (
                <ActivityRow key={item.id} item={item} divider={i > 0} />
              ))}
            </SurfaceCard>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
};
