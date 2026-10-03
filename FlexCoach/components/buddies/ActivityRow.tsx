import React from 'react';
import { TouchableOpacity, View } from 'react-native';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import { ActivityKind } from '../../data/models';
import { ActivityEntry } from '../../data/hooks/useBuddyActivity';
import { useAuth } from '../../data/auth/AuthProvider';
import { BuddyRoutes } from '../../screens/Buddies/routes';
import { Reactions } from './Reactions';
import { CustomText } from '../text/customText';
import { Icon, IconSource } from '../icons/Icon';
import { generalIcons } from '../icons/icon-library';
import { useTheme } from '../../theme';
import { Avatar } from './Avatar';

export const activityIcon = (kind: ActivityKind): IconSource => {
  switch (kind) {
    case 'workout_done':
      return generalIcons.check;
    case 'workout_skipped':
      return generalIcons.xMark;
    case 'workout_pushed':
      return generalIcons.calendarDay;
    case 'streak':
      return generalIcons.flame;
    case 'record':
      return generalIcons.trophy;
    case 'cycle_done':
      return generalIcons.medal;
    case 'plan_shared':
      return generalIcons.dumbbell;
    default:
      return generalIcons.users;
  }
};

/** "Just now", "3h ago", "Yesterday", or the date. */
export const whenLabel = (ts: number, now = Date.now()): string => {
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

/** The activity line a row opens: a finished workout opens itself, a record opens the workout it was set in. */
const workoutLineOf = (item: ActivityEntry): string | null =>
  item.kind === 'workout_done' ? item.id : item.kind === 'record' && item.sessionId ? `workout_done:${item.sessionId}` : null;

/** A shared-plan line carries the plan's id in its own id ("plan_shared:<planId>"). */
const sharedPlanIdOf = (item: ActivityEntry): string | null =>
  item.kind === 'plan_shared' && item.id.startsWith('plan_shared:') ? item.id.slice('plan_shared:'.length) : null;

/**
 * One line of the buddy feed: who, what, when, and any reactions under it.
 * Finished workouts and records open the workout's page (records and
 * reactions in full), a shared plan opens the plan; `onReact` adds the
 * emoji picker to the line itself.
 */
export const ActivityRow = ({ item, divider = false, compact = false, onReact }: { item: ActivityEntry; divider?: boolean; compact?: boolean; onReact?: (emoji: string | null) => void }) => {
  const { colors, spacing } = useTheme();
  const { uid } = useAuth();
  const navigation = useNavigation<NavigationProp<BuddyRoutes>>();
  const who = item.isMe ? 'You' : item.actorName?.split(' ')[0] ?? 'A buddy';
  const tone = item.kind === 'workout_skipped' ? colors.inkMuted : item.kind === 'streak' || item.kind === 'record' ? colors.accent : colors.ink;
  const workoutLine = item.isMe ? null : workoutLineOf(item);
  const planId = item.isMe ? null : sharedPlanIdOf(item);
  const open = workoutLine
    ? () => navigation.navigate('BuddyWorkoutScreen', { uid: item.ownerId, activityId: workoutLine, displayName: item.actorName })
    : planId
      ? () => navigation.navigate('BuddyPlanScreen', { ownerUid: item.ownerId, planId, ownerName: item.actorName })
      : undefined;
  return (
    <TouchableOpacity disabled={!open} onPress={open} activeOpacity={0.7} accessibilityRole={open ? 'button' : undefined} style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: compact ? spacing.sm : spacing.md, paddingHorizontal: compact ? 0 : spacing.lg, borderTopWidth: divider ? 1 : 0, borderTopColor: colors.line }}>
      <View>
        <Avatar uri={item.actorPhoto} name={item.isMe ? item.actorName ?? 'You' : item.actorName} size={compact ? 32 : 40} />
        <View style={{ position: 'absolute', right: -4, bottom: -4, width: 18, height: 18, borderRadius: 9, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' }}>
          <Icon icon={activityIcon(item.kind)} size={11} color={tone} strokeWidth={3} />
        </View>
      </View>
      <View style={{ flex: 1 }}>
        <CustomText variant={compact ? 'body' : 'bodyStrong'} numberOfLines={1}>
          {who} · {item.title}
        </CustomText>
        {item.detail && !compact ? <CustomText variant="caption" color={colors.inkMuted} numberOfLines={1}>{item.detail}</CustomText> : null}
        {!item.isMe && <Reactions reactions={item.reactions} myUid={uid} onReact={onReact} compact={compact} />}
      </View>
      <CustomText variant="caption" color={colors.inkMuted}>{whenLabel(item.at)}</CustomText>
    </TouchableOpacity>
  );
};
