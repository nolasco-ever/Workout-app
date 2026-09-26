import React from 'react';
import { View } from 'react-native';
import { ActivityKind } from '../../data/models';
import { ActivityEntry } from '../../data/hooks/useBuddyActivity';
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

/** One line of the buddy feed: who, what, when. */
export const ActivityRow = ({ item, divider = false, compact = false }: { item: ActivityEntry; divider?: boolean; compact?: boolean }) => {
  const { colors, spacing } = useTheme();
  const who = item.isMe ? 'You' : item.actorName?.split(' ')[0] ?? 'A buddy';
  const tone = item.kind === 'workout_skipped' ? colors.inkMuted : item.kind === 'streak' || item.kind === 'record' ? colors.accent : colors.ink;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: compact ? spacing.sm : spacing.md, paddingHorizontal: compact ? 0 : spacing.lg, borderTopWidth: divider ? 1 : 0, borderTopColor: colors.line }}>
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
      </View>
      <CustomText variant="caption" color={colors.inkMuted}>{whenLabel(item.at)}</CustomText>
    </View>
  );
};
