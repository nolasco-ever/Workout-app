import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RouteProp, useRoute } from '@react-navigation/native';
import { useAuth } from '../../data/auth/AuthProvider';
import { Activity } from '../../data/models';
import { buddyRepository } from '../../data/repositories/buddyRepository';
import { reactToActivity } from '../../data/services/buddyService';
import { useBuddies } from '../../data/hooks/useBuddies';
import { CustomText } from '../../components/text/customText';
import { SurfaceCard } from '../../components/cards/SurfaceCard';
import { Avatar } from '../../components/buddies/Avatar';
import { Reactions } from '../../components/buddies/Reactions';
import { Icon } from '../../components/icons/Icon';
import { generalIcons } from '../../components/icons/icon-library';
import { useTheme } from '../../theme';
import { BuddyRoutes } from './routes';

const dateLine = (ts: number): string => new Date(ts).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' });

/**
 * One finished workout of a buddy's, opened from the feed or a push: what
 * they did, the records they set in it, and the reactions it has drawn.
 * Only what the activity line carries is shown; their sets stay private.
 */
export const BuddyWorkoutScreen = () => {
  const { params } = useRoute<RouteProp<BuddyRoutes, 'BuddyWorkoutScreen'>>();
  const { colors, spacing } = useTheme();
  const { uid, profile } = useAuth();
  const { buddies } = useBuddies();
  const buddy = buddies.find(b => b.userId === params.uid) ?? null;
  const name = buddy?.card?.displayName ?? buddy?.displayName ?? params.displayName ?? 'Your buddy';
  const [item, setItem] = useState<Activity | null | undefined>(undefined);

  const load = useCallback(async () => {
    try {
      setItem(await buddyRepository.getActivity(params.uid, params.activityId));
    } catch (err) {
      console.warn('buddy workout load failed', err);
      setItem(null);
    }
  }, [params.uid, params.activityId]);
  useEffect(() => {
    load();
  }, [load]);

  const react = (emoji: string | null) => {
    if (!uid || !item) return;
    const before = item;
    const reactions = { ...(item.reactions ?? {}) };
    if (emoji) reactions[uid] = { emoji, at: Date.now(), name: profile?.displayName ?? null };
    else delete reactions[uid];
    setItem({ ...item, reactions });
    reactToActivity({ uid, displayName: profile?.displayName ?? null }, item, emoji).catch(err => {
      console.warn('reaction failed', err);
      setItem(before);
    });
  };

  return (
    <SafeAreaView edges={['bottom', 'left', 'right']} style={{ flex: 1, backgroundColor: colors.ground }}>
      <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing.xxl }}>
        {item === undefined && <ActivityIndicator color={colors.accent} style={{ marginTop: spacing.xxl }} />}
        {item === null && (
          <View style={{ marginTop: spacing.xxl, gap: spacing.sm }}>
            <CustomText variant="heading" centered>Not here any more</CustomText>
            <CustomText variant="body" color={colors.inkMuted} centered>This workout isn't in {name.split(' ')[0]}'s activity now.</CustomText>
          </View>
        )}
        {item && (
          <>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
              <Avatar uri={buddy?.card?.photoUrl ?? buddy?.photoUrl} name={name} size={48} />
              <View style={{ flex: 1 }}>
                <CustomText variant="heading">{item.title.replace(/^Finished /, '')}</CustomText>
                <CustomText variant="caption" color={colors.inkMuted}>
                  {name.split(' ')[0]} · {dateLine(item.at)}{item.detail ? ` · ${item.detail}` : ''}
                </CustomText>
              </View>
            </View>

            <View style={{ gap: spacing.sm }}>
              <CustomText variant="overline" color={colors.inkMuted}>Records</CustomText>
              <SurfaceCard style={{ padding: 0 }}>
                {(item.records ?? []).length === 0 ? (
                  <View style={{ padding: spacing.lg }}>
                    <CustomText variant="body" color={colors.inkMuted}>No new records this time.</CustomText>
                  </View>
                ) : (
                  (item.records ?? []).map((r, i) => (
                    <View key={`${r.exerciseName}-${i}`} style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.lg, borderTopWidth: i > 0 ? 1 : 0, borderTopColor: colors.line }}>
                      <Icon icon={generalIcons.trophy} size={18} color={colors.accent} />
                      <CustomText variant="body" style={{ flex: 1 }} numberOfLines={1}>{r.exerciseName}</CustomText>
                      <CustomText variant="bodyStrong" color={colors.accent}>{r.value}</CustomText>
                    </View>
                  ))
                )}
              </SurfaceCard>
            </View>

            <View style={{ gap: spacing.sm }}>
              <CustomText variant="overline" color={colors.inkMuted}>Reactions</CustomText>
              <SurfaceCard>
                <Reactions reactions={item.reactions} myUid={uid} onReact={react} />
              </SurfaceCard>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};
