import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { FeedNotification, FeedNotificationKind } from '../../../../data/models';
import { useNotificationFeed } from '../../../../data/notifications/useNotificationFeed';
import { openTarget } from '../../../../data/notifications/openTarget';
import { CustomText } from '../../../../components/text/customText';
import { SurfaceCard } from '../../../../components/cards/SurfaceCard';
import { SwipeToDelete } from '../../../../components/list-items/SwipeToDelete';
import { Icon, IconSource } from '../../../../components/icons/Icon';
import { generalIcons } from '../../../../components/icons/icon-library';
import { useTheme } from '../../../../theme';

const iconFor = (kind: FeedNotificationKind): IconSource => {
  switch (kind) {
    case 'missed_workout':
      return generalIcons.calendarDay;
    case 'cycle_finished':
      return generalIcons.flame;
    case 'achievement':
    case 'buddy_achievement':
      return generalIcons.trophy;
    case 'buddy_streak':
      return generalIcons.flame;
    case 'buddy_added':
      return generalIcons.handshake;
    case 'buddy_removed':
      return generalIcons.users;
    default:
      return generalIcons.users;
  }
};

/** "Just now", "3h ago", "Yesterday", or the date. */
const when = (ts: number, now = Date.now()): string => {
  const mins = Math.round((now - ts) / 60_000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  return new Date(ts).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};

const dayGroup = (ts: number, now = Date.now()): string => {
  const d = new Date(ts);
  const n = new Date(now);
  const sameDay = d.toDateString() === n.toDateString();
  if (sameDay) return 'Today';
  const days = Math.round((n.setHours(0, 0, 0, 0) - new Date(ts).setHours(0, 0, 0, 0)) / 86_400_000);
  if (days === 1) return 'Yesterday';
  if (days < 7) return 'This week';
  return 'Earlier';
};

/**
 * The feed: durable notifications worth revisiting or acting on. Reminders
 * that go stale within hours never land here; they live only in the OS tray.
 * Swipe a row left to delete it. Everything counts as read once the screen
 * is left, so the unread dot on Home clears without a button.
 */
export const NotificationsScreen = () => {
  const { colors, spacing, radius } = useTheme();
  const feed = useNotificationFeed();
  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await feed.refresh();
    } catch {
      // The live watch still has the last known feed; nothing to show.
    } finally {
      setRefreshing(false);
    }
  }, [feed.refresh]);
  const refreshControl = <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />;

  // Leaving the screen (back, a tap through, or closing the app) marks
  // everything read. The ref keeps the latest feed for the cleanup.
  const markAllRead = useRef(feed.markAllRead);
  useEffect(() => {
    markAllRead.current = feed.markAllRead;
  }, [feed.markAllRead]);
  useFocusEffect(
    useCallback(() => {
      return () => {
        markAllRead.current().catch(() => undefined);
      };
    }, []),
  );

  const open = (item: FeedNotification) => {
    if (item.readAt === null) feed.markRead(item.id).catch(() => undefined);
    openTarget(item.target);
  };

  const groups: { label: string; items: FeedNotification[] }[] = [];
  for (const item of feed.items) {
    const label = dayGroup(item.createdAt);
    const last = groups[groups.length - 1];
    if (last && last.label === label) last.items.push(item);
    else groups.push({ label, items: [item] });
  }

  return (
    <SafeAreaView edges={['bottom', 'left', 'right']} style={{ flex: 1, backgroundColor: colors.ground }}>
      {feed.loading ? (
        <ActivityIndicator color={colors.accent} style={{ marginTop: spacing.xxl }} />
      ) : feed.items.length === 0 ? (
        <ScrollView refreshControl={refreshControl} contentContainerStyle={{ flexGrow: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl, gap: spacing.md }}>
          <View style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: colors.surfaceRaised, alignItems: 'center', justifyContent: 'center' }}>
            <Icon icon={generalIcons.bell} color={colors.inkMuted} size={32} />
          </View>
          <CustomText variant="heading" centered>All caught up</CustomText>
          <CustomText variant="body" color={colors.inkMuted} centered>
            Missed workouts, finished cycles and buddy activity show up here. Daily reminders come as notifications only.
          </CustomText>
        </ScrollView>
      ) : (
        <ScrollView refreshControl={refreshControl} contentContainerStyle={{ padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing.xxl }}>
          {groups.map(group => (
            <View key={group.label} style={{ gap: spacing.sm }}>
              <CustomText variant="overline" color={colors.inkMuted}>{group.label}</CustomText>
              <SurfaceCard style={{ padding: 0, overflow: 'hidden' }}>
                {group.items.map((item, i) => {
                  const unread = item.readAt === null;
                  return (
                    <SwipeToDelete key={item.id} label={`Delete notification: ${item.title}`} onDelete={() => feed.remove(item.id).catch(() => undefined)}>
                    <TouchableOpacity
                      onPress={() => open(item)}
                      accessibilityRole="button"
                      accessibilityLabel={`${unread ? 'Unread. ' : ''}${item.title}. ${item.body}`}
                      style={{ flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md, padding: spacing.lg, borderTopWidth: i ? 1 : 0, borderTopColor: colors.line }}
                    >
                      <View style={{ width: 36, height: 36, borderRadius: radius.sm, backgroundColor: unread ? colors.accentTint : colors.surfaceRaised, alignItems: 'center', justifyContent: 'center' }}>
                        <Icon icon={iconFor(item.kind)} size={18} color={unread ? colors.accent : colors.inkMuted} />
                      </View>
                      <View style={{ flex: 1, gap: 2 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                          <CustomText variant={unread ? 'bodyStrong' : 'body'} style={{ flex: 1 }}>{item.title}</CustomText>
                          <CustomText variant="caption" color={colors.inkMuted}>{when(item.createdAt)}</CustomText>
                        </View>
                        <CustomText variant="caption" color={colors.inkMuted}>{item.body}</CustomText>
                      </View>
                      {unread && <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: colors.accent, marginTop: 6 }} />}
                    </TouchableOpacity>
                    </SwipeToDelete>
                  );
                })}
              </SurfaceCard>
            </View>
          ))}
          <CustomText variant="caption" color={colors.inkMuted} centered>Swipe a notification left to delete it.</CustomText>
        </ScrollView>
      )}
    </SafeAreaView>
  );
};
