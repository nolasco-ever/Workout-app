import React, { useCallback, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NavigationProp, useFocusEffect, useNavigation } from '@react-navigation/native';
import { useBuddies } from '../../data/hooks/useBuddies';
import { useBuddyPlans } from '../../data/hooks/useBuddyPlans';
import { describeSchedule } from '../Plans/components/planSummary';
import { CustomText } from '../../components/text/customText';
import { SurfaceCard } from '../../components/cards/SurfaceCard';
import { PrimaryButton } from '../../components/buttons/PrimaryButton';
import { Icon } from '../../components/icons/Icon';
import { directionIcons } from '../../components/icons/icon-library';
import { Avatar } from '../../components/buddies/Avatar';
import { useTheme } from '../../theme';
import { BuddyRoutes } from './routes';

/** Every plan your buddies have chosen to share. Tap one to look through it and save a copy. */
export const BuddyPlansScreen = () => {
  const navigation = useNavigation<NavigationProp<BuddyRoutes>>();
  const { colors, spacing } = useTheme();
  const { buddies, loading: buddiesLoading } = useBuddies();
  const shared = useBuddyPlans(buddies);
  const [refreshing, setRefreshing] = useState(false);
  useFocusEffect(
    useCallback(() => {
      shared.refresh().catch(() => undefined);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [shared.refresh]),
  );
  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await shared.refresh();
    } finally {
      setRefreshing(false);
    }
  };
  const loading = buddiesLoading || shared.loading;

  return (
    <SafeAreaView edges={['bottom', 'left', 'right']} style={{ flex: 1, backgroundColor: colors.ground }}>
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />}
        contentContainerStyle={{ padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing.xxl, flexGrow: 1 }}
      >
        {loading && <ActivityIndicator color={colors.accent} style={{ marginTop: spacing.xxl }} />}
        {!loading && shared.plans.length === 0 && (
          <View style={{ flex: 1, justifyContent: 'center', gap: spacing.md, padding: spacing.lg }}>
            <CustomText variant="heading" centered>No shared plans yet</CustomText>
            <CustomText variant="body" color={colors.inkMuted} centered>
              {buddies.length === 0 ? 'Add a buddy, and any plan they make visible shows up here for you to copy.' : 'When a buddy turns on "Visible to buddies" for a plan, it shows up here. You can do the same from any of your plans.'}
            </CustomText>
            {buddies.length === 0 && <PrimaryButton label="Add a buddy" onPress={() => navigation.navigate('BuddiesScreen')} />}
          </View>
        )}
        {shared.plans.length > 0 && (
          <SurfaceCard style={{ padding: 0 }}>
            {shared.plans.map((s, i) => (
              <TouchableOpacity
                key={`${s.ownerUid}:${s.plan.id}`}
                onPress={() => navigation.navigate('BuddyPlanScreen', { ownerUid: s.ownerUid, planId: s.plan.id, ownerName: s.ownerName })}
                style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.lg, borderTopWidth: i ? 1 : 0, borderTopColor: colors.line }}
              >
                <Avatar uri={s.ownerPhoto} name={s.ownerName} size={40} />
                <View style={{ flex: 1 }}>
                  <CustomText variant="bodyStrong">{s.plan.name}</CustomText>
                  <CustomText variant="caption" color={colors.inkMuted}>
                    by {s.ownerName ?? 'a buddy'} · {s.plan.workouts.length} workout{s.plan.workouts.length === 1 ? '' : 's'} · {describeSchedule(s.plan)}
                  </CustomText>
                </View>
                <Icon icon={directionIcons.angleRight} size={20} color={colors.inactive} />
              </TouchableOpacity>
            ))}
          </SurfaceCard>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};
