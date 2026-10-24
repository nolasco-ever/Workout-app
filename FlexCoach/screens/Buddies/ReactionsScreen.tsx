import React, { useMemo, useState } from 'react';
import { ScrollView, TouchableOpacity, View } from 'react-native';
import { RouteProp, useRoute } from '@react-navigation/native';
import { SafeAreaView } from '../../components/layout/SafeAreaView';
import { Avatar } from '../../components/buddies/Avatar';
import { CustomText } from '../../components/text/customText';
import { useAuth } from '../../data/auth/AuthProvider';
import { useBuddies } from '../../data/hooks/useBuddies';
import { ActivityReaction, Id, REACTION_EMOJI } from '../../data/models';
import { useTheme } from '../../theme';
import { reactedAgo } from '../../data/engine/buddies';

export type ReactionsParams = { ReactionsScreen: { reactions: Record<Id, ActivityReaction> } };

const AVATAR = 44;

/**
 * Who reacted (v1 #5, designed on the canvas, owner 2026-10-24): a modal, so
 * it keeps its size whatever it shows. Chips across the top filter by emoji
 * (All first); each row is the person's photo with their emoji on its
 * corner, their name ("You" for mine) and when, newest first. Photos come
 * with the reaction; older reactions borrow a buddy's photo, else initials.
 */
export const ReactionsScreen = () => {
  const { params } = useRoute<RouteProp<ReactionsParams, 'ReactionsScreen'>>();
  const { colors, spacing, radius } = useTheme();
  const { uid, profile } = useAuth();
  const { buddies } = useBuddies();
  const [filter, setFilter] = useState<string | null>(null);

  const rows = useMemo(() => {
    const photoOf = new Map(buddies.map(b => [b.userId, b.card?.photoUrl ?? b.photoUrl ?? null]));
    return Object.entries(params.reactions ?? {})
      .map(([id, r]) => {
        const mine = id === uid;
        return {
          id,
          emoji: r.emoji,
          at: r.at,
          name: mine ? 'You' : r.name?.trim() || 'A buddy',
          // Initials come from the real name, even on my own row.
          initialsFrom: mine ? profile?.displayName ?? 'You' : r.name?.trim() || null,
          photo: mine ? profile?.photoUrl ?? r.photoUrl ?? null : r.photoUrl ?? photoOf.get(id) ?? null,
        };
      })
      .sort((a, b) => b.at - a.at);
  }, [params.reactions, buddies, uid, profile?.displayName, profile?.photoUrl]);

  const counts = new Map<string, number>();
  for (const r of rows) counts.set(r.emoji, (counts.get(r.emoji) ?? 0) + 1);
  const known: readonly string[] = REACTION_EMOJI;
  const emojis = [...known.filter(e => counts.has(e)), ...[...counts.keys()].filter(e => !known.includes(e))];
  const shown = filter ? rows.filter(r => r.emoji === filter) : rows;

  const chip = (key: string | null, label: React.ReactNode, a11y: string) => {
    const on = filter === key;
    return (
      <TouchableOpacity
        key={key ?? 'all'}
        onPress={() => setFilter(key)}
        accessibilityRole="tab"
        accessibilityState={{ selected: on }}
        accessibilityLabel={a11y}
        style={{ height: 36, paddingHorizontal: spacing.md, borderRadius: radius.pill, flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: on ? colors.accentTint : colors.surfaceRaised, borderWidth: 1, borderColor: on ? colors.accent : colors.transparent }}
      >
        {label}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView edges={['bottom', 'left', 'right']} style={{ flex: 1, backgroundColor: colors.ground }}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }} contentContainerStyle={{ gap: spacing.sm, paddingHorizontal: spacing.lg, paddingVertical: spacing.md }} accessibilityRole="tablist">
        {chip(null, <CustomText variant="label" color={filter === null ? colors.accent : colors.ink}>All {rows.length}</CustomText>, `All reactions, ${rows.length}`)}
        {emojis.map(e =>
          chip(
            e,
            <>
              <CustomText variant="body" style={{ fontSize: 16, lineHeight: 20 }}>{e}</CustomText>
              <CustomText variant="label" color={filter === e ? colors.accent : colors.ink}>{counts.get(e)}</CustomText>
            </>,
            `${e}, ${counts.get(e)}`,
          ),
        )}
      </ScrollView>
      <ScrollView contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingBottom: spacing.xl }}>
        {shown.map((r, i) => (
          <View key={r.id} accessible accessibilityLabel={`${r.name}, ${r.emoji}, ${reactedAgo(r.at)}`} style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.md, borderTopWidth: i ? 1 : 0, borderTopColor: colors.line }}>
            <View style={{ width: AVATAR, height: AVATAR }}>
              <Avatar uri={r.photo} name={r.initialsFrom} size={AVATAR} />
              <View style={{ position: 'absolute', right: -4, bottom: -4, width: 24, height: 24, borderRadius: 12, backgroundColor: colors.ground, alignItems: 'center', justifyContent: 'center' }}>
                <CustomText variant="caption" style={{ fontSize: 14, lineHeight: 18 }}>{r.emoji}</CustomText>
              </View>
            </View>
            <CustomText variant="bodyStrong" numberOfLines={1} style={{ flex: 1 }}>{r.name}</CustomText>
            <CustomText variant="caption" color={colors.inkMuted}>{reactedAgo(r.at)}</CustomText>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
};
